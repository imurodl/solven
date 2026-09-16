import { gql, login, getState, setState, stateEntries, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { AGENTS, MECHANICS } from './data/people.mjs';
import { USERS } from './02-members.mjs';

// Follows, car likes and views by the seeded buyers. Like mutations toggle,
// so every (user, car) pair is checked through getCar.meLiked before liking.
const CAR_COMMENTS = [
	'Is the price negotiable?', 'Beautiful colour!', 'How many owners?', 'Does it have the winter package?', 'Test drove one of these last year, great car.',
	'Any accident history?', 'Still available?', 'Great price for the mileage.', 'Can you ship to Busan?', 'What is the battery health on this one?',
	'멋진 차네요. 실물 보고 싶어요.', '가격 조정 가능할까요?', 'Narxi kelishiladimi?', 'Хорошая машина, пробег небольшой.',
];

export const seededCarIds = () => stateEntries('car:').filter((c) => c.id);

async function session(nick) {
	const creds = getState(`member:${nick}`);
	if (!creds) return null;
	return login(nick, creds.password);
}

export async function run() {
	const r = rng(404);
	const cars = seededCarIds();
	if (!cars.length) {
		log('engagement: no seeded cars in state, run 03-cars first');
		return;
	}
	// Popularity: a few cars get most of the attention.
	const popularity = new Map(cars.map((c) => [c.id, r.weighted([[1, 50], [2, 30], [4, 15], [8, 5]])]));

	let follows = 0, likes = 0, views = 0, comments = 0;
	for (const u of USERS) {
		const s = await session(u.nick);
		if (!s) continue;
		// Follow 2-5 agents (+ occasionally a mechanic).
		if (!getState(`follows:${u.nick}`)) {
			const targets = r.sample(AGENTS, r.int(2, 5)).map((a) => a.nick);
			if (r.chance(0.3)) targets.push(r.pick(MECHANICS).nick);
			for (const nick of targets) {
				const t = getState(`member:${nick}`);
				if (!t || isDry()) continue;
				try {
					await gql('mutation($i:String!){subscribe(input:$i){_id}}', { i: t.id }, s.token);
					follows++;
				} catch (err) {
					if (!/already|exists/i.test(err.message)) log(`engagement: follow failed ${u.nick}->${nick}: ${err.message}`);
				}
			}
			setState(`follows:${u.nick}`, targets);
		}
		// View 8-40 cars, like about a third of them, comment on a few.
		if (getState(`engaged:${u.nick}`)) continue;
		const n = r.int(8, 40);
		const picks = r.sample(cars.map((c) => Array(popularity.get(c.id)).fill(c)).flat(), n * 2);
		const seen = new Set();
		for (const c of picks) {
			if (seen.has(c.id) || seen.size >= n) continue;
			seen.add(c.id);
			if (isDry()) continue;
			try {
				const d = await gql('query($id:String!){getCar(carId:$id){_id meLiked{myFavorite}}}', { id: c.id }, s.token);
				views++;
				const liked = d.getCar.meLiked?.[0]?.myFavorite;
				if (!liked && r.chance(0.35)) {
					await gql('mutation($id:String!){likeTargetCar(carId:$id){_id}}', { id: c.id }, s.token);
					likes++;
				}
				if (r.chance(0.08)) {
					await gql('mutation($i:CommentInput!){createComment(input:$i){_id}}', { i: { commentGroup: 'CAR', commentRefId: c.id, commentContent: r.pick(CAR_COMMENTS) } }, s.token);
					comments++;
				}
			} catch (err) {
				log(`engagement: ${u.nick} on ${c.id}: ${err.message}`);
			}
		}
		setState(`engaged:${u.nick}`, true);
		log(`engagement: ${u.nick} viewed ${seen.size}`);
	}
	// Agents follow each other a little.
	for (const a of AGENTS) {
		if (getState(`follows:${a.nick}`) || isDry()) continue;
		const s = await session(a.nick);
		if (!s) continue;
		const targets = r.sample(AGENTS.filter((x) => x.nick !== a.nick), r.int(0, 3)).map((x) => x.nick);
		for (const nick of targets) {
			const t = getState(`member:${nick}`);
			if (!t) continue;
			try {
				await gql('mutation($i:String!){subscribe(input:$i){_id}}', { i: t.id }, s.token);
				follows++;
			} catch {}
		}
		setState(`follows:${a.nick}`, targets);
	}
	log(`engagement: follows ${follows}, views ${views}, likes ${likes}, comments ${comments}`);
}

if (process.argv[1].endsWith('04-engagement.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
