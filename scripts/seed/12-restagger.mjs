import { gql, login, getState, stateEntries, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';

// Re-staggers the hot-deal windows of the seeded sale cars so the homepage
// always has live and upcoming deals. Safe to run any time (weekly cron).
export async function run() {
	const week = Math.floor(Date.now() / (7 * 86400000));
	const r = rng(900 + week);
	const cars = stateEntries('car:').filter((c) => c.id && c.sale);
	let updated = 0;
	for (const car of cars) {
		const creds = getState(`member:${car.seller}`);
		if (!creds) continue;
		const s = await login(car.seller, creds.password);
		const cur = (await gql('query($id:String!){getCar(carId:$id){carPrice carSalePrice carSaleExpiresAt carStatus}}', { id: car.id }, s.token)).getCar;
		if (cur.carStatus !== 'ACTIVE') continue;
		const expiresAt = cur.carSaleExpiresAt ? new Date(cur.carSaleExpiresAt).getTime() : 0;
		// Keep deals that still have more than 2 days to run.
		if (expiresAt - Date.now() > 2 * 86400000) continue;
		const startsIn = r.int(-2, 10);
		const length = r.int(4, 21);
		const start = Date.now() + startsIn * 86400000;
		const pct = r.int(5, 18);
		const input = {
			_id: car.id,
			carIsOnSale: true,
			carSalePrice: Math.round((cur.carPrice * (1 - pct / 100)) / 100) * 100,
			carSaleStartsAt: new Date(start).toISOString(),
			carSaleExpiresAt: new Date(start + length * 86400000).toISOString(),
		};
		if (isDry()) {
			log(`restagger: [dry] ${car.title} -${pct}% in ${startsIn}d for ${length}d`);
			continue;
		}
		try {
			await gql('mutation($i:CarUpdate!){updateCar(input:$i){_id}}', { i: input }, s.token);
			updated++;
		} catch (err) {
			log(`restagger: ${car.title}: ${err.message}`);
		}
	}
	log(`restagger: ${updated} of ${cars.length} sale cars re-staggered`);
}

if (process.argv[1].endsWith('12-restagger.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
