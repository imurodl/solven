import { gql, login, getState, setState, stateEntries, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';

// Keeps the hot-deal shelf stocked: at least LIVE deals running right now and
// a few UPCOMING ones, re-staggered from the seeded cars. Safe to run any time
// (weekly cron); sold or removed listings are skipped.
const LIVE = Number(process.env.SEED_LIVE_DEALS || 6);
const UPCOMING = Number(process.env.SEED_UPCOMING_DEALS || 4);
const DAY = 86400000;

async function sellerSession(nick) {
	const creds = getState(`member:${nick}`);
	return creds ? login(nick, creds.password) : null;
}

export async function run() {
	const week = Math.floor(Date.now() / (7 * DAY));
	const r = rng(900 + week);
	const now = Date.now();
	const cars = r.shuffle(stateEntries('car:').filter((c) => c.id));
	const live = [], upcoming = [], idle = [];
	const sessions = new Map();
	for (const car of cars) {
		if (!sessions.has(car.seller)) sessions.set(car.seller, await sellerSession(car.seller));
		const s = sessions.get(car.seller);
		if (!s) continue;
		const cur = (await gql('query($id:String!){getCar(carId:$id){carPrice carIsOnSale carSaleStartsAt carSaleExpiresAt carStatus carAvailability}}', { id: car.id }, s.token).catch(() => null))?.getCar;
		if (!cur || cur.carStatus !== 'ACTIVE' || cur.carAvailability !== 'AVAILABLE') continue;
		const starts = cur.carSaleStartsAt ? new Date(cur.carSaleStartsAt).getTime() : 0;
		const ends = cur.carSaleExpiresAt ? new Date(cur.carSaleExpiresAt).getTime() : 0;
		const entry = { car, cur, s };
		if (cur.carIsOnSale && ends > now + DAY && starts <= now) live.push(entry);
		else if (cur.carIsOnSale && ends > now + DAY && starts > now) upcoming.push(entry);
		else idle.push(entry);
	}
	log(`restagger: live ${live.length}, upcoming ${upcoming.length}, idle ${idle.length}`);

	const apply = async ({ car, cur, s }, startsInDays, lengthDays, pct) => {
		const start = now + startsInDays * DAY;
		const input = {
			_id: car.id,
			carIsOnSale: true,
			carSalePrice: Math.round((cur.carPrice * (1 - pct / 100)) / 100) * 100,
			carSaleStartsAt: new Date(start).toISOString(),
			carSaleExpiresAt: new Date(start + lengthDays * DAY).toISOString(),
		};
		if (isDry()) return log(`restagger: [dry] ${car.title} -${pct}% in ${startsInDays}d for ${lengthDays}d`);
		await gql('mutation($i:CarUpdate!){updateCar(input:$i){_id}}', { i: input }, s.token);
		setState(`car:${car.key}`, { ...getState(`car:${car.key}`), sale: true });
	};

	let changed = 0;
	// Pull upcoming deals forward, then promote idle cars, until LIVE deals run now.
	while (live.length < LIVE && (upcoming.length || idle.length)) {
		const e = upcoming.length ? upcoming.shift() : idle.shift();
		await apply(e, -r.int(0, 2) / 24, r.int(4, 21), r.int(5, 18));
		live.push(e);
		changed++;
	}
	while (upcoming.length < UPCOMING && idle.length) {
		const e = idle.shift();
		await apply(e, r.int(1, 10), r.int(4, 21), r.int(5, 18));
		upcoming.push(e);
		changed++;
	}
	log(`restagger: ${changed} listings updated -> live ${live.length}, upcoming ${upcoming.length}`);
}

if (process.argv[1].endsWith('12-restagger.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
