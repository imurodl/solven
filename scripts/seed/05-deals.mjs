import { gql, upload, login, adminSession, getState, setState, stateEntries, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { searchCommons, downloadImage } from './lib/commons.mjs';
import { isValidImage } from './lib/images.mjs';
import { AGENTS, randomAddress } from './data/people.mjs';
import { REVIEWS } from './data/templates.mjs';
import { USERS } from './02-members.mjs';
import { brandByKey } from './data/brands.mjs';

// Orders through the real state machine, then verified reviews.
// With an admin session, completed deals keep the listing active
// (confirmOrder keepListing); without one, only SEED_SOLD_POOL cars are
// completed and they end up SOLD, which is what a real buyer flow does.
const COMPLETED = Number(process.env.SEED_COMPLETED || 130);
const INFLIGHT = Number(process.env.SEED_INFLIGHT || 20);
const CANCELLED = Number(process.env.SEED_CANCELLED || 10);
const SOLD_POOL = Number(process.env.SEED_SOLD_POOL || 30);
const RATING_WEIGHTS = [[5, 45], [4, 35], [3, 12], [2, 5], [1, 3]];

const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

async function session(nick) {
	const creds = getState(`member:${nick}`);
	return creds ? login(nick, creds.password) : null;
}

async function reviewPhotos(car, buyer) {
	const brand = brandByKey(car.brand);
	const model = brand?.models.find((m) => m.name === car.model);
	const pool = await searchCommons(`"${model?.search || `${brand?.search} ${car.model}`}"`, { limit: 50 });
	const detail = pool.filter((p) => /interior|dashboard|rear|seat|wheel/i.test(p.title));
	const picks = (detail.length ? detail : pool).slice(-2);
	const files = [];
	for (const img of picks) {
		const f = await downloadImage(img);
		if (f && (await isValidImage(f.buffer))) files.push(f);
	}
	if (!files.length) return [];
	try {
		return await upload(files, 'review', buyer.token);
	} catch {
		return [];
	}
}

async function runDeal({ r, admin, car, buyerNick, outcome, index }) {
	const stateKey = `order:${buyerNick}|${car.key}`;
	if (getState(stateKey)) return getState(stateKey);
	const buyer = await session(buyerNick);
	const seller = await session(car.seller);
	if (!buyer || !seller) return null;
	const person = USERS.find((u) => u.nick === buyerNick);
	const delivery = r.chance(0.55) ? 'DELIVERY' : 'PICKUP';
	const { city, address } = randomAddress(r);
	const input = {
		carId: car.id,
		deliveryMethod: delivery,
		deliveryInfo: { fullName: person?.name || buyerNick, phone: `010-${r.int(2000, 9999)}-${r.int(1000, 9999)}`, address: delivery === 'DELIVERY' ? `${address} ${r.int(1, 300)}` : undefined, city: delivery === 'DELIVERY' ? city : undefined, note: r.chance(0.3) ? r.pick(['Please call before delivery.', 'Weekend handover preferred.', 'I will bring my mechanic for the inspection.', 'Need the export certificate as well.']) : undefined },
	};
	if (isDry()) {
		log(`deals: [dry] ${buyerNick} -> ${car.title} (${outcome})`);
		return null;
	}
	let orderId;
	try {
		const d = await gql('mutation($i:OrderInput!){createOrder(input:$i){_id orderStatus}}', { i: input }, buyer.token);
		orderId = d.createOrder._id;
	} catch (err) {
		log(`deals: createOrder failed for ${car.title}: ${err.message}`);
		setState(stateKey, { failed: err.message });
		return null;
	}
	const sellerToken = seller.token;
	// The API's demo progression may advance PENDING->ACCEPTED and PAID->DELIVERED
	// on its own; when a step finds the order already past it, just continue.
	const SEQ = ['PENDING', 'ACCEPTED', 'PAID', 'DELIVERED', 'COMPLETED'];
	const step = async (mutation, token, reaches) => {
		try {
			return await gql(mutation, { id: orderId }, token);
		} catch (err) {
			const cur = (await gql('query($id:String!){getOrderById(orderId:$id){orderStatus}}', { id: orderId }, buyer.token)).getOrderById.orderStatus;
			if (SEQ.indexOf(cur) >= SEQ.indexOf(reaches)) return null;
			throw err;
		}
	};
	try {
		if (outcome === 'PENDING') {
			// leave as is
		} else if (outcome === 'DECLINED') {
			await gql('mutation($id:String!){respondOrder(orderId:$id,accept:false,reason:"Sold locally yesterday, sorry."){_id}}', { id: orderId }, sellerToken);
		} else if (outcome === 'CANCELLED') {
			await gql('mutation($id:String!){cancelOrder(orderId:$id,reason:"Changed my mind after the inspection."){_id}}', { id: orderId }, buyer.token);
		} else {
			await step('mutation($id:String!){respondOrder(orderId:$id,accept:true){_id}}', sellerToken, 'ACCEPTED');
			if (outcome === 'ACCEPTED') return finish(stateKey, orderId, outcome);
			await step('mutation($id:String!){payOrderDeposit(orderId:$id){_id}}', buyer.token, 'PAID');
			if (outcome === 'PAID') return finish(stateKey, orderId, outcome);
			await step('mutation($id:String!){markOrderDelivered(orderId:$id){_id}}', sellerToken, 'DELIVERED');
			if (outcome === 'DELIVERED') return finish(stateKey, orderId, outcome);
			if (admin && !car.soldPool) await step('mutation($id:String!){confirmOrder(orderId:$id,keepListing:true){_id}}', admin.token, 'COMPLETED');
			else await step('mutation($id:String!){confirmOrder(orderId:$id){_id}}', buyer.token, 'COMPLETED');
			if (outcome === 'RETURN_REQUESTED') await gql('mutation($id:String!){requestReturn(orderId:$id,reason:"Gearbox warning light on day two."){_id}}', { id: orderId }, buyer.token);
		}
	} catch (err) {
		log(`deals: transition failed (${outcome}) for ${car.title}: ${err.message}`);
	}
	return finish(stateKey, orderId, outcome);
}

function finish(stateKey, orderId, outcome) {
	const rec = { orderId, outcome };
	setState(stateKey, rec);
	return rec;
}

export async function run() {
	const r = rng(505);
	const admin = await adminSession();
	const cars = stateEntries('car:').filter((c) => c.id);
	if (!cars.length) {
		log('deals: no seeded cars, run 03-cars first');
		return;
	}
	// In-flight orders reserve their car, so plan them first and keep those cars
	// out of every other order. Without admin, completed deals sell the car, so
	// they are limited to a pool of SEED_SOLD_POOL cars, one deal each.
	const plan = [];
	const usedPairs = new Set();
	const reserved = new Set();
	const pickPair = (source) => {
		for (let tries = 0; tries < 80; tries++) {
			const car = r.pick(source);
			if (!car || reserved.has(car.id)) continue;
			const buyer = r.pick(USERS).nick;
			const k = `${buyer}|${car.key}`;
			if (usedPairs.has(k)) continue;
			usedPairs.add(k);
			return { car, buyer };
		}
		return null;
	};
	const inflight = admin ? INFLIGHT : Math.min(INFLIGHT, 12);
	for (let i = 0; i < inflight; i++) {
		const p = pickPair(cars);
		if (!p) break;
		reserved.add(p.car.id);
		plan.push({ ...p, outcome: r.pick(['PENDING', 'ACCEPTED', 'PAID', 'DELIVERED']) });
	}
	const free = cars.filter((c) => !reserved.has(c.id));
	const pool = admin ? free : r.shuffle(free).slice(0, SOLD_POOL).map((c) => ({ ...c, soldPool: true }));
	const completedTarget = admin ? COMPLETED : Math.min(COMPLETED, pool.length);
	for (let i = 0; i < completedTarget; i++) {
		const p = pickPair(pool);
		if (!p) break;
		if (!admin) reserved.add(p.car.id); // sold after completion
		plan.push({ ...p, outcome: r.chance(0.04) ? 'RETURN_REQUESTED' : 'COMPLETED' });
	}
	for (let i = 0; i < CANCELLED; i++) {
		const p = pickPair(free);
		if (!p) break;
		plan.push({ ...p, outcome: r.chance(0.5) ? 'CANCELLED' : 'DECLINED' });
	}
	log(`deals: plan ${plan.length} orders (${completedTarget} completed, ${inflight} in flight, ${CANCELLED} cancelled)${admin ? ' with keepListing' : ' without admin: sold pool'}`);

	let done = 0;
	for (const [index, item] of plan.entries()) {
		const rec = await runDeal({ r, admin, car: item.car, buyerNick: item.buyer, outcome: item.outcome, index });
		if (rec?.orderId) done++;
	}
	log(`deals: ${done} orders in place`);

	// Reviews on completed deals.
	let reviews = 0, reactions = 0;
	const completedRecs = stateEntries('order:').filter((o) => o.orderId && (o.outcome === 'COMPLETED' || o.outcome === 'RETURN_REQUESTED'));
	for (const rec of completedRecs) {
		const [buyerNick, carKey] = rec.key.split('|', 2);
		const carKeyFull = rec.key.slice(buyerNick.length + 1);
		const reviewKey = `review:${rec.key}`;
		if (getState(reviewKey) || isDry()) continue;
		const car = cars.find((c) => c.key === carKeyFull);
		const buyer = await session(buyerNick);
		if (!car || !buyer) continue;
		const rating = rec.outcome === 'RETURN_REQUESTED' ? r.pick([1, 2]) : r.weighted(RATING_WEIGHTS);
		const seller = AGENTS.find((a) => a.nick === car.seller);
		const content = fill(r.pick(REVIEWS[rating]), { model: car.model, seller: seller?.name || car.seller });
		const reviewImages = rating >= 4 && r.chance(0.3) ? await reviewPhotos(car, buyer) : [];
		try {
			const d = await gql('mutation($i:ReviewInput!){createReview(input:$i){_id}}', { i: { carId: car.id, orderId: rec.orderId, reviewRating: rating, reviewContent: content, reviewImages } }, buyer.token);
			setState(reviewKey, { id: d.createReview._id, rating });
			reviews++;
			// Helpful votes from other users.
			const voters = r.sample(USERS.filter((u) => u.nick !== buyerNick), r.weighted([[0, 40], [1, 25], [2, 15], [4, 12], [7, 8]]));
			for (const v of voters) {
				const vs = await session(v.nick);
				if (!vs) continue;
				try {
					await gql('mutation($id:String!){toggleReviewReaction(reviewId:$id,reaction:LIKE){likesCount}}', { id: d.createReview._id }, vs.token);
					reactions++;
				} catch {}
			}
		} catch (err) {
			log(`deals: review failed for ${car.title}: ${err.message}`);
			if (/already/i.test(err.message)) setState(reviewKey, { duplicate: true });
		}
	}
	log(`deals: ${reviews} reviews written, ${reactions} helpful votes`);
}

if (process.argv[1].endsWith('05-deals.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
