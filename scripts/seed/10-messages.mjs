import { gql, login, getState, setState, stateEntries, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { MESSAGES_BUYER, MESSAGES_SELLER, MESSAGES_FOLLOWUP, SERVICE_REQUESTS } from './data/templates.mjs';
import { MECHANICS } from './data/people.mjs';
import { USERS } from './02-members.mjs';

const CONVERSATIONS = Number(process.env.SEED_CONVERSATIONS || 40);
const SERVICE_REQ = Number(process.env.SEED_SERVICE_REQUESTS || 10);
const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

async function session(nick) {
	const creds = getState(`member:${nick}`);
	return creds ? login(nick, creds.password) : null;
}

export async function run() {
	const r = rng(808);
	const cars = stateEntries('car:').filter((c) => c.id);
	if (!cars.length) return log('messages: no seeded cars');
	// Conversations can only start on listings that are still active (sold cars reject messages).
	const statusCache = new Map();
	const isActive = async (car) => {
		if (!statusCache.has(car.id)) {
			const d = await gql('query($id:String!){getCar(carId:$id){carStatus}}', { id: car.id }).catch(() => null);
			statusCache.set(car.id, d?.getCar?.carStatus === 'ACTIVE');
		}
		return statusCache.get(car.id);
	};
	let convs = 0, msgs = 0;
	for (let i = 0; i < CONVERSATIONS * 2 && convs < CONVERSATIONS; i++) {
		const car = r.pick(cars);
		const buyerNick = r.pick(USERS).nick;
		const key = `conv:${buyerNick}|${car.key}`;
		if (getState(key)) {
			convs++;
			continue;
		}
		if (isDry()) continue;
		if (!(await isActive(car))) continue;
		const buyer = await session(buyerNick);
		const seller = await session(car.seller);
		if (!buyer || !seller) continue;
		const person = USERS.find((u) => u.nick === buyerNick);
		const v = { model: car.model, city: person?.city ? person.city.charAt(0) + person.city.slice(1).toLowerCase() : 'Seoul' };
		const idx = r.int(0, MESSAGES_BUYER.length - 1);
		try {
			const d = await gql('mutation($i:SendMessageInput!){sendMessage(input:$i){conversationId}}', { i: { carId: car.id, message: fill(MESSAGES_BUYER[idx], v), name: person?.name, phone: r.chance(0.5) ? `010-${r.int(2000, 9999)}-${r.int(1000, 9999)}` : undefined } }, buyer.token);
			const conversationId = d.sendMessage.conversationId;
			msgs++;
			// Most sellers reply; some conversations stay unread on purpose.
			if (r.chance(0.8)) {
				await gql('mutation($i:ReplyMessageInput!){replyMessage(input:$i){_id}}', { i: { conversationId, message: fill(MESSAGES_SELLER[idx], v) } }, seller.token);
				msgs++;
				const extra = r.int(0, 3);
				for (let k = 0; k < extra; k++) {
					const fromBuyer = k % 2 === 0;
					await gql('mutation($i:ReplyMessageInput!){replyMessage(input:$i){_id}}', { i: { conversationId, message: fromBuyer ? r.pick(MESSAGES_FOLLOWUP) : r.pick(MESSAGES_SELLER) } }, fromBuyer ? buyer.token : seller.token);
					msgs++;
				}
			}
			setState(key, { conversationId });
			convs++;
		} catch (err) {
			log(`messages: ${buyerNick} -> ${car.seller}: ${err.message}`);
		}
	}
	let reqs = 0;
	for (let i = 0; i < SERVICE_REQ; i++) {
		const mech = r.pick(MECHANICS);
		const u = r.pick(USERS);
		const key = `svcreq:${u.nick}|${mech.nick}`;
		if (getState(key) || isDry()) continue;
		const buyer = await session(u.nick);
		const m = await session(mech.nick);
		const mechId = getState(`member:${mech.nick}`)?.id;
		if (!buyer || !m || !mechId) continue;
		const car = r.pick(cars);
		try {
			const d = await gql('mutation($i:SendServiceRequestInput!){sendServiceRequest(input:$i){conversationId}}', { i: { mechanicId: mechId, message: fill(r.pick(SERVICE_REQUESTS), { model: car.model, year: car.year, city: 'Seoul', brand: car.brand }), carInfo: `${car.year} ${car.brand} ${car.model}`, phone: `010-${r.int(2000, 9999)}-${r.int(1000, 9999)}` } }, buyer.token);
			if (r.chance(0.7)) await gql('mutation($i:ReplyMessageInput!){replyMessage(input:$i){_id}}', { i: { conversationId: d.sendServiceRequest.conversationId, message: r.pick(['Sure, bring it in on Thursday morning and we will diagnose it for free.', 'We can do that. Rough estimate is in the 200 to 350 USD range depending on parts.', 'Yes, we have a slot next Tuesday. Send the plate number and I will book it.', 'Ha, bo\'ladi. Ertaga ertalab olib keling.']) } }, m.token);
			setState(key, { conversationId: d.sendServiceRequest.conversationId });
			reqs++;
		} catch (err) {
			log(`messages: service request ${u.nick} -> ${mech.nick}: ${err.message}`);
		}
	}
	log(`messages: ${convs} conversations (${msgs} messages), ${reqs} service requests`);
}

if (process.argv[1].endsWith('10-messages.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
