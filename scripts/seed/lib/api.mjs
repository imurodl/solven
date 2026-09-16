import fs from 'node:fs';
import path from 'node:path';

// Paced GraphQL client for seeding through the public API. The API throttles
// at 300 requests/min per IP, so every call goes through a token bucket.
const API = process.env.SEED_API || 'http://localhost:3097/graphql';
const RATE = Number(process.env.SEED_RATE || 4.2); // requests per second
const DRY = process.argv.includes('--dry');

let tokens = RATE;
let last = Date.now();
const waiters = [];
const refill = () => {
	const now = Date.now();
	tokens = Math.min(RATE, tokens + ((now - last) / 1000) * RATE);
	last = now;
	while (tokens >= 1 && waiters.length) {
		tokens -= 1;
		waiters.shift()();
	}
};
setInterval(refill, 50);
const acquire = () => new Promise((resolve) => { waiters.push(resolve); refill(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
	constructor(message, code, query) {
		super(message);
		this.code = code;
		this.query = query;
	}
}

// Per-handler limits on the API (signup 5/min, login 10/min, orders 10/min,
// uploads 20/min ...). The throttler window is sliding: every attempt, even a
// rejected one, counts for 60s, so the client paces those handlers ahead of
// time and, if it still gets throttled, waits a full window before retrying.
const tokenCache = new Map();
const THROTTLED = /Too Many Requests|ThrottlerException/i;
const EXPIRED = /jwt expired|NOT_AUTHENTICATED|Please login|Unauthorized|invalid token/i;
const credsByToken = new Map();
const HANDLER_INTERVALS = {
	signup: 12200, login: 6200, imageUploader: 3100, imagesUploader: 3100, modelUploader: 12200,
	createOrder: 6200, createReview: 6200, createComment: 4100, sendMessage: 3100, sendServiceRequest: 6200,
	subscribe: 1100, unsubscribe: 1100, toggleReviewReaction: 1100, replyMessage: 1100, likeTargetMember: 1100,
};
const lastCall = new Map();
const operationOf = (query) => /(?:mutation|query)?[^{]*\{\s*(\w+)/.exec(query)?.[1];
async function paceHandler(op) {
	const interval = HANDLER_INTERVALS[op];
	if (!interval) return;
	const wait = (lastCall.get(op) || 0) + interval - Date.now();
	if (wait > 0) await sleep(wait);
	lastCall.set(op, Date.now());
}
const retryAfterMs = (res) => {
	const h = Number(res?.headers?.get?.('retry-after'));
	return (Number.isFinite(h) && h > 0 ? h : 60) * 1000 + 1500;
};

export async function gql(query, variables = {}, token) {
	const headers = { 'Content-Type': 'application/json' };
	const op = operationOf(query);
	let relogged = false;
	for (let attempt = 1; attempt <= 12; attempt++) {
		await paceHandler(op);
		await acquire();
		if (token) headers.Authorization = `Bearer ${token}`;
		let res;
		try {
			res = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
		} catch (err) {
			if (attempt >= 5) throw err;
			await sleep(1500 * attempt);
			continue;
		}
		if (res.status === 429 || res.status >= 502) {
			await sleep(res.status === 429 ? retryAfterMs(res) : 3000);
			continue;
		}
		const json = await res.json().catch(() => ({}));
		if (json.errors?.length) {
			const e = json.errors[0];
			if (THROTTLED.test(e.message)) {
				log(`throttled on ${op}, waiting ${Math.round(retryAfterMs(res) / 1000)}s`);
				await sleep(retryAfterMs(res));
				continue;
			}
			if (EXPIRED.test(e.message) && token && credsByToken.has(token) && !relogged) {
				const c = credsByToken.get(token);
				tokenCache.delete(c.nick);
				token = (await login(c.nick, c.password)).token;
				relogged = true;
				continue;
			}
			throw new ApiError(e.message, e.code || e.extensions?.code, query.slice(0, 60));
		}
		return json.data;
	}
	throw new ApiError('gave up after retries', 'RETRY', query.slice(0, 60));
}

// Multipart upload per the graphql-upload spec. Files: [{buffer, filename, type}]
export async function upload(files, target, token) {
	if (DRY) return files.map((_, i) => `uploads/${target}/dry-${i}.jpg`);
	await acquire();
	const many = files.length > 1;
	const form = new FormData();
	form.append(
		'operations',
		JSON.stringify(
			many
				? { query: 'mutation($files:[Upload!]!,$target:String!){imagesUploader(files:$files,target:$target)}', variables: { files: files.map(() => null), target } }
				: { query: 'mutation($file:Upload!,$target:String!){imageUploader(file:$file,target:$target)}', variables: { file: null, target } },
		),
	);
	const map = {};
	files.forEach((_, i) => (map[String(i)] = [many ? `variables.files.${i}` : 'variables.file']));
	form.append('map', JSON.stringify(map));
	files.forEach((f, i) => form.append(String(i), new Blob([f.buffer], { type: f.type || 'image/jpeg' }), f.filename));
	for (let attempt = 1; attempt <= 12; attempt++) {
		await paceHandler(many ? 'imagesUploader' : 'imageUploader');
		const res = await fetch(API, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'apollo-require-preflight': 'true' },
			body: form,
		}).catch(() => null);
		if (!res || res.status === 429 || res.status >= 502) {
			await sleep(res?.status === 429 ? retryAfterMs(res) : 3000);
			continue;
		}
		const json = await res.json().catch(() => ({}));
		if (json.errors?.length) {
			if (THROTTLED.test(json.errors[0].message)) {
				log(`throttled on upload, waiting ${Math.round(retryAfterMs(res) / 1000)}s`);
				await sleep(retryAfterMs(res));
				continue;
			}
			throw new ApiError(json.errors[0].message, json.errors[0].code, 'upload');
		}
		return many ? json.data.imagesUploader : [json.data.imageUploader];
	}
	throw new ApiError('upload gave up', 'RETRY', 'upload');
}

// ---- state (seed key -> created ids/credentials), never committed ----
const STATE_FILE = process.env.SEED_STATE || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'state.local.json');
let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : {};
export const getState = (k, d) => (k in state ? state[k] : d);
export const setState = (k, v) => {
	state[k] = v;
	fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));
};
export const stateEntries = (prefix) => Object.entries(state).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ key: k.slice(prefix.length), ...v }));
export const isDry = () => DRY;
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---- sessions ----
export async function login(nick, password) {
	if (tokenCache.has(nick)) return tokenCache.get(nick);
	const d = await gql('mutation($i:LoginInput!){login(input:$i){_id memberType accessToken}}', { i: { memberNick: nick, memberPassword: password } });
	tokenCache.set(nick, { id: d.login._id, type: d.login.memberType, token: d.login.accessToken });
	credsByToken.set(d.login.accessToken, { nick, password });
	return tokenCache.get(nick);
}

// Signup-or-login by nick; credentials are remembered in the state file.
export async function ensureMember({ nick, password, phone, type, email }) {
	const creds = getState(`member:${nick}`);
	const pass = creds?.password || password;
	if (creds) return { id: creds.id, type: creds.type, created: false, session: () => login(nick, pass) };
	if (DRY) return { id: `dry-${nick}`, type, token: 'dry', created: true, session: async () => ({ token: 'dry' }) };
	let d;
	try {
		d = await gql('mutation($i:MemberInput!){signup(input:$i){_id memberType accessToken}}', {
			i: { memberNick: nick, memberPassword: pass, memberPhone: phone, memberType: type, memberEmail: email },
		});
	} catch (err) {
		// Nick already taken (state lost or a previous partial run): fall back to login.
		if (!/already used|USED_NICK|exists/i.test(err.message)) throw err;
		const s = await login(nick, pass);
		setState(`member:${nick}`, { id: s.id, password: pass, type: s.type });
		return { ...s, created: false, session: async () => s };
	}
	setState(`member:${nick}`, { id: d.signup._id, password: pass, type });
	tokenCache.set(nick, { id: d.signup._id, type: d.signup.memberType, token: d.signup.accessToken });
	credsByToken.set(d.signup.accessToken, { nick, password: pass });
	const s = tokenCache.get(nick);
	return { ...s, created: true, session: async () => s };
}

export async function adminSession() {
	const nick = process.env.SEED_ADMIN_NICK;
	const pass = process.env.SEED_ADMIN_PASS;
	if (!nick || !pass) return null;
	const s = await login(nick, pass);
	if (s.type !== 'ADMIN') throw new Error(`SEED_ADMIN_NICK "${nick}" is ${s.type}, not ADMIN`);
	return s;
}

export async function fetchBuffer(url, headers = {}) {
	for (let attempt = 1; attempt <= 3; attempt++) {
		const res = await fetch(url, { headers: { 'User-Agent': 'SolvenSeed/1.0 (https://solven.uz)', ...headers } }).catch(() => null);
		if (res?.ok) return Buffer.from(await res.arrayBuffer());
		await sleep(2000 * attempt);
	}
	return null;
}
