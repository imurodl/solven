import fs from 'node:fs';
import path from 'node:path';
import { gql, upload, ensureMember, adminSession, getState, setState, log, isDry, fetchBuffer } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { AGENTS, MECHANICS, buildUsers, phoneFor } from './data/people.mjs';

const r = rng(101);
export const USERS = buildUsers(rng(202));

const portraitUrl = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

async function ensureProfile(person, type, portraitIndex) {
	const member = await ensureMember({ nick: person.nick, password: `${person.nick.replace(/\W/g, '').slice(0, 6)}Pw${r.int(10, 99)}`.slice(0, 12), phone: phoneFor(r), type, email: person.email });
	if (getState(`profile:${person.nick}`)) return member;
	if (isDry()) return member;
	const session = await member.session();
	let memberImage;
	const raw = await fetchBuffer(portraitUrl(person.gender, portraitIndex));
	if (raw) {
		try {
			[memberImage] = await upload([{ buffer: raw, filename: `${person.nick}.jpg`, type: 'image/jpeg' }], 'member', session.token);
		} catch (err) {
			log(`members: avatar upload failed for ${person.nick}: ${err.message}`);
		}
	}
	const input = { _id: session.id, memberFullName: person.name, memberAddress: person.addr, memberDesc: person.desc || undefined, memberImage };
	if (person.email) input.memberEmail = person.email;
	await gql('mutation($i:MemberUpdate!){updateMember(input:$i){_id}}', { i: input }, session.token);
	setState(`profile:${person.nick}`, true);
	log(`members: ${type} ${person.nick} profile set${member.created ? ' (new)' : ''}`);
	return member;
}

// Existing seller accounts on solven.uz that own the original 8 listings.
const LEGACY_AGENTS = {
	Max: { name: 'Max Motors', addr: 'Gangnam-gu, Seoul', desc: 'Founder of Solven. I list a few cars from my own network of owners and dealers, always with full history.' },
	David: { name: 'David Auto', addr: 'Seo-gu, Gwangju', desc: 'Small dealership in Gwangju focused on family SUVs and clean sedans.' },
	Jack: { name: "Jack's Cars", addr: 'Yuseong-gu, Daejeon', desc: 'Hybrids and EVs in Daejeon. Every car comes with a fresh inspection report.' },
	Shawn: { name: 'Shawn Motors', addr: 'Haeundae-gu, Busan', desc: 'Busan-based seller of seven-seaters and SUVs. Delivery across Gyeongnam.' },
	John: { name: 'John Trade', addr: 'Yeonsu-gu, Incheon', desc: 'Budget cars for first-time buyers near Songdo. Export paperwork available.' },
	Jacob: { name: 'Jacob Select', addr: 'Suseong-gu, Daegu', desc: 'Selected imports and low-mileage Korean cars in Daegu.' },
	Alex: { name: 'Alex Autos', addr: 'Mapo-gu, Seoul', desc: 'Independent dealer in Mapo. Straight talk, fair prices.' },
	Andrew: { name: 'Andrew Cars', addr: 'Nowon-gu, Seoul', desc: 'Compact cars and city SUVs in north Seoul.' },
};

// Accounts are never removed by heuristics. The step writes a report of
// suspicious accounts (numeric nicks, no content, no profile) to
// cache/junk-report.json; the owner reviews it and re-runs with
// SEED_DELETE_NICKS="nick1,nick2" to soft-delete exactly those.
const SUSPICIOUS = /^(\d{5,}|test\w*|asd\w*|qwe\w*|aaa+|user\d*|string|null|undefined)$/i;
const REPORT = path.join(path.dirname(new URL(import.meta.url).pathname), 'cache', 'junk-report.json');

async function reviewAccounts(admin) {
	let page = 1;
	const suspicious = [];
	const legacy = [];
	while (true) {
		const d = await gql(
			'query($i:MembersInquiry!){getAllMembersByAdmin(input:$i){list{_id memberNick memberType memberStatus memberCars memberArticles memberImage memberFullName createdAt}}}',
			{ i: { page, limit: 100, search: {} } },
			admin.token,
		);
		const list = d.getAllMembersByAdmin.list;
		for (const m of list) {
			if (LEGACY_AGENTS[m.memberNick]) legacy.push(m);
			else if (m.memberType !== 'ADMIN' && m.memberStatus === 'ACTIVE' && !getState(`member:${m.memberNick}`) && !(m.memberCars || m.memberArticles) && (SUSPICIOUS.test(m.memberNick) || (!m.memberImage && !m.memberFullName)))
				suspicious.push({ nick: m.memberNick, type: m.memberType, createdAt: m.createdAt });
		}
		if (list.length < 100) break;
		page++;
	}
	fs.writeFileSync(REPORT, JSON.stringify(suspicious, null, 1));
	log(`members: ${suspicious.length} suspicious accounts written to ${REPORT} (review, then SEED_DELETE_NICKS=...)`);

	const explicit = (process.env.SEED_DELETE_NICKS || '').split(',').map((s) => s.trim()).filter(Boolean);
	for (const nick of explicit) {
		const found = suspicious.find((s) => s.nick === nick);
		if (!found) {
			log(`members: "${nick}" is not in the suspicious list, not touching it`);
			continue;
		}
		if (isDry()) continue;
		const d = await gql('query($i:MembersInquiry!){getAllMembersByAdmin(input:$i){list{_id memberNick}}}', { i: { page: 1, limit: 5, search: { text: nick } } }, admin.token);
		const m = d.getAllMembersByAdmin.list.find((x) => x.memberNick === nick);
		if (!m) continue;
		await gql('mutation($i:MemberUpdate!){updateMemberByAdmin(input:$i){_id}}', { i: { _id: m._id, memberStatus: 'DELETE' } }, admin.token);
		log(`members: soft-deleted ${nick} (owner-listed)`);
	}

	for (const m of legacy) {
		if (m.memberFullName || isDry()) continue;
		const fix = LEGACY_AGENTS[m.memberNick];
		let memberImage;
		const raw = await fetchBuffer(portraitUrl('men', r.int(0, 99)));
		if (raw) {
			try {
				[memberImage] = await upload([{ buffer: raw, filename: `${m.memberNick}.jpg`, type: 'image/jpeg' }], 'member', admin.token);
			} catch {}
		}
		await gql('mutation($i:MemberUpdate!){updateMemberByAdmin(input:$i){_id}}', { i: { _id: m._id, memberFullName: fix.name, memberAddress: fix.addr, memberDesc: fix.desc, memberImage } }, admin.token);
		log(`members: legacy ${m.memberNick} profile filled`);
	}
}

export async function run() {
	const admin = await adminSession();
	if (admin) await reviewAccounts(admin);
	else log('members: no admin session, skipping account review');
	let i = 0;
	for (const a of AGENTS) await ensureProfile(a, 'AGENT', (i++ * 7) % 100);
	for (const m of MECHANICS) await ensureProfile(m, 'MECHANIC', (i++ * 11) % 100);
	for (const u of USERS) await ensureProfile(u, 'USER', u.portrait);
	log(`members: ${AGENTS.length} agents, ${MECHANICS.length} mechanics, ${USERS.length} users ready`);
}

if (process.argv[1].endsWith('02-members.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
