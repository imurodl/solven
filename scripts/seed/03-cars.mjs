import { gql, upload, login, adminSession, getState, setState, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { searchCommons, downloadImage, credit } from './lib/commons.mjs';
import { isValidImage } from './lib/images.mjs';
import { BRANDS, TRIMS } from './data/brands.mjs';
import { AGENTS, randomAddress } from './data/people.mjs';
import { DESC_OPENERS, DESC_BODY, DESC_CLOSERS, OWNERS, OPTION_LABELS } from './data/templates.mjs';

const TARGET = Number(process.env.SEED_CARS || 170);
const COLORS = [['WHITE', 30], ['BLACK', 22], ['GRAY', 16], ['SILVER', 10], ['BLUE', 8], ['RED', 5], ['GREEN', 2], ['BEIGE', 2], ['BROWN', 2], ['GOLD', 1], ['ORANGE', 1], ['YELLOW', 1]];
const OPTIONS = Object.keys(OPTION_LABELS);
const YEARS = [[2013, 1], [2014, 2], [2015, 3], [2016, 4], [2017, 6], [2018, 8], [2019, 10], [2020, 12], [2021, 13], [2022, 13], [2023, 12], [2024, 9], [2025, 5], [2026, 2]];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

// Deterministic catalog: same seed -> same cars, so re-runs only fill gaps.
export function buildCatalog() {
	const r = rng(303);
	const cars = [];
	const weightedBrands = BRANDS.map((b) => [b, b.weight]);
	const sellers = AGENTS.map((a) => a.nick);
	const sellerOf = (i) => sellers[i % sellers.length]; // every agent gets at least floor(TARGET/30) cars
	for (let i = 0; i < TARGET; i++) {
		const brand = r.weighted(weightedBrands);
		const model = r.pick(brand.models);
		const year = r.weighted(YEARS);
		const age = Math.max(0, 2026 - year);
		const condition = year >= 2025 && r.chance(0.5) ? 'NEW' : 'USED';
		const km = condition === 'NEW' ? r.int(10, 900) : Math.round((age + 0.5) * r.int(7000, 19000) + r.int(0, 4000));
		const fuel = r.pick(model.fuels);
		const transmission = fuel === 'ELECTRIC' || fuel === 'HYBRID' || fuel === 'HYDROGEN' ? 'AUTOMATIC' : r.chance(0.94) ? 'AUTOMATIC' : 'MANUAL';
		const evBrand = ['TESLA', 'POLESTAR', 'BYD'].includes(brand.key);
		const trim = r.pick(fuel === 'ELECTRIC' && !evBrand ? TRIMS.ev : TRIMS[brand.key] || TRIMS[brand.family]);
		const seller = sellerOf(i);
		const agent = AGENTS.find((a) => a.nick === seller);
		const { city, address } = r.chance(0.8) ? { city: agent.city, address: agent.addr } : randomAddress(r);
		const depreciation = Math.pow(0.86, age) * (1 - Math.min(0.25, Math.max(0, km / 10000 - age * 1.2) * 0.02));
		let price = Math.round((model.base * depreciation * (1 + (r.next() - 0.5) * 0.12)) / 100) * 100;
		price = Math.max(price, 1500);
		const nOpts = r.int(4, 11);
		const options = r.sample(OPTIONS, nOpts);
		const onSale = r.chance(0.13);
		const saleOffset = r.int(-4, 16); // days until the sale starts (negative = already running)
		const saleLength = r.int(4, 21);
		const key = `${seller}|${year} ${brand.display} ${model.name} ${trim}`.replace(/\s+/g, ' ');
		cars.push({
			key,
			seller,
			brand,
			model,
			year,
			km,
			fuel,
			transmission,
			trim,
			city,
			address,
			price,
			options,
			condition,
			color: r.weighted(COLORS),
			seats: model.seats,
			barter: r.chance(0.1),
			rent: r.chance(0.05),
			owners: r.pick(OWNERS),
			vin: r.chance(0.6) ? `${r.pick(['KMH', 'KNA', 'KMJ', 'WBA', 'WDD', 'WAU', '5YJ', 'JTD', 'KPT', 'KNM'])}${Array.from({ length: 14 }, () => r.pick('ABCDEFGHJKLMNPRSTUVWXYZ0123456789'.split(''))).join('')}` : undefined,
			sale: onSale ? { pct: r.int(5, 18), startsInDays: saleOffset, lengthDays: saleLength } : null,
			photoSlot: r.int(0, 999),
			desc: [r.pick(DESC_OPENERS), r.pick(DESC_BODY), r.pick(DESC_CLOSERS)],
		});
	}
	return cars;
}

// "Polestar Polestar 3" and "Mazda Mazda3" read badly: skip the brand when the model already carries it.
const titleOf = (c) => {
	const brand = c.model.name.toLowerCase().startsWith(c.brand.display.toLowerCase()) ? '' : c.brand.display;
	return `${c.year} ${brand} ${c.model.name.replace(/-Class$/, '')} ${c.trim === 'Base' ? '' : c.trim}`.replace(/\s+/g, ' ').trim();
};

function descriptionOf(c) {
	const v = {
		year: c.year,
		brand: c.brand.display,
		model: c.model.name,
		trim: c.trim,
		km: c.km.toLocaleString('en-US'),
		fuel: c.fuel === 'ELECTRIC' ? 'fully electric' : c.fuel.toLowerCase(),
		city: cap(c.city.toLowerCase()),
		seller: AGENTS.find((a) => a.nick === c.seller)?.name || c.seller,
		owners: c.owners,
		opt1: OPTION_LABELS[c.options[0]],
		opt2: OPTION_LABELS[c.options[1]],
	};
	return c.desc
		.map((t) => fill(t, v))
		.join(' ')
		.replace(/(^|[.!?]\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
}

// Photo pool per model; each car takes 3-4 distinct images, rotating through the pool.
const pools = new Map();
async function photosFor(c) {
	const query = `"${c.model.search || `${c.brand.search} ${c.model.name}`}"`;
	if (!pools.has(query)) pools.set(query, await searchCommons(query, { limit: 50 }));
	let pool = pools.get(query);
	if (pool.length < 2) {
		const alt = `${c.brand.search} ${c.model.name}`;
		if (!pools.has(alt)) pools.set(alt, await searchCommons(alt, { limit: 50 }));
		pool = pools.get(alt);
	}
	if (pool.length < 2) return [];
	// Titles that name the model beat generic brand shots (auto-show crowds etc.).
	const primary = c.model.name.replace(/-Class$/, '');
	const strictRe = new RegExp(/^\d/.test(primary) ? `${primary.replace(/ /g, '[ -]?')}|${primary[0]}er\b` : primary.replace(/[.\-]/g, '[.\\- ]?'), 'i');
	const strict = pool.filter((p) => strictRe.test(p.title));
	if (strict.length >= 4) pool = strict;
	// Score by how well the photo matches this listing: a year near the model
	// year and a plain exterior view beat old generations and show-floor shots.
	const score = (p) => {
		let s = 0;
		const years = (p.title.match(/(19|20)\d\d/g) || []).map(Number).filter((y) => y > 1990 && y <= 2027);
		if (years.length) {
			const d = Math.min(...years.map((y) => Math.abs(y - c.year)));
			s += d <= 2 ? 3 : d <= 5 ? 1 : d <= 9 ? -1 : -4;
		}
		if (/motor ?show|auto ?show|salon|iaa|gims|expo|exhibition|museum/i.test(p.title)) s -= 2;
		if (/front|side|three.?quarter|profile/i.test(p.title)) s += 1;
		if (/interior|dashboard|cockpit|seat|trunk|boot/i.test(p.title)) s -= 3;
		return s;
	};
	const ranked = pool.map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s);
	const top = ranked.slice(0, Math.max(6, Math.ceil(ranked.length / 3))).map((x) => x.p);
	const exterior = top.filter((p) => !/interior|dashboard|engine|seat|cockpit|trunk/i.test(p.title));
	const detail = pool.filter((p) => /interior|dashboard|rear|back|seat/i.test(p.title));
	const start = c.photoSlot % Math.max(1, exterior.length);
	const chosen = [];
	for (let i = 0; i < exterior.length && chosen.length < 3; i++) chosen.push(exterior[(start + i) % exterior.length]);
	if (detail.length) chosen.push(detail[c.photoSlot % detail.length]);
	const files = [];
	for (const img of chosen) {
		if (files.some((f) => f.title === img.title)) continue;
		const file = await downloadImage(img);
		if (file && (await isValidImage(file.buffer))) files.push({ ...file, title: img.title, credit: credit(img) });
	}
	return files;
}

function saleFields(c) {
	if (!c.sale) return {};
	const now = Date.now();
	const start = now + c.sale.startsInDays * 86400000;
	const end = start + c.sale.lengthDays * 86400000;
	return {
		carIsOnSale: true,
		carSalePrice: Math.round((c.price * (1 - c.sale.pct / 100)) / 100) * 100,
		carSaleStartsAt: new Date(start).toISOString(),
		carSaleExpiresAt: new Date(Math.max(end, now + 2 * 86400000)).toISOString(),
	};
}

// Spec fixes for the eight legacy listings on solven.uz (ids from the live API).
const LEGACY_FIXES = [
	{ _id: '6841fe9fb5ac77afbbcc15c3', carType: 'SUV', carFuelType: 'DIESEL', carTransmission: 'AUTOMATIC', carTitle: '2008 Hyundai Tucson JM 2.0 CRDi Premium', carDesc: 'Honest 2008 Tucson with 150,000 km, serviced regularly and driven mainly on the motorway. New timing belt and water pump last year. A dependable, cheap-to-run SUV for a first car or a work vehicle.' },
	{ _id: '683caef137b5920f80f561e1', carType: 'SUV', carFuelType: 'GASOLINE', carTransmission: 'AUTOMATIC', carSeats: 7, carTitle: '2020 Hyundai Palisade LX2 3.8 Prestige 7-seater', carDesc: 'Seven-seat Palisade Prestige with 37,000 km, one owner, ventilated seats and the full smart sense package. Garaged in Busan, never towed, all services at the Hyundai dealer.' },
	{ _id: '6821e2c76c20602f3547ab32', carType: 'MIDSIZE', carFuelType: 'HYBRID', carTransmission: 'AUTOMATIC', carTitle: '2017 Chevrolet Malibu Hybrid Premier', carDesc: 'Malibu Hybrid in excellent condition, 57,000 km, returning around 17 km per litre in mixed driving. Leather, heated seats, Bose audio. Hybrid battery covered until 2027.' },
	{ _id: '6821e21a6c20602f3547ab2f', carType: 'SUV', carFuelType: 'ELECTRIC', carTransmission: 'AUTOMATIC', carTitle: '2020 Hyundai Ioniq 5 Long Range AWD', carDesc: 'Ioniq 5 Long Range with the 72.6 kWh battery and all-wheel drive. 115,000 km of mostly motorway use; battery health report shows 91%. Vehicle-to-load adapter and home charger included.' },
	{ _id: '6821e09c6c20602f3547ab0d', carType: 'SUV', carFuelType: 'HYBRID', carTransmission: 'AUTOMATIC', carSeats: 7, carTitle: '2023 Kia Sorento Hybrid Signature 7-seater', carDesc: 'Nearly new Sorento Hybrid Signature, 15,700 km, still under full manufacturer warranty. Panoramic roof, 360 camera, highway driving assist. One careful owner in Gwangju.' },
	{ _id: '6821dfc56c20602f3547ab0a', carType: 'SUV', carFuelType: 'DIESEL', carTransmission: 'AUTOMATIC', carSeats: 5, carTitle: '2017 Mercedes-Benz GLC 220d 4MATIC AMG Line', carDesc: 'GLC 220d with the AMG Line package, 17,500 km, air suspension and Burmester audio. Full Mercedes service history, second key, no accidents on record.' },
	{ _id: '6821de906c20602f3547ab06', carType: 'SUV', carFuelType: 'DIESEL', carTransmission: 'AUTOMATIC', carSeats: 5, carTitle: '2018 BMW X5 xDrive30d M Sport', carDesc: 'X5 30d M Sport with 32,600 km, panoramic roof, Harman Kardon and the comfort seats. Serviced at BMW Gwangju, tyres replaced this spring.' },
	{ _id: '6821ddcb6c20602f3547aaf8', carType: 'MIDSIZE', carFuelType: 'ELECTRIC', carTransmission: 'AUTOMATIC', carSeats: 5, carTitle: '2019 Tesla Model 3 Long Range', carDesc: 'Model 3 Long Range with 16,000 km, autopilot, white interior and a fresh battery report at 95% state of health. Supercharging history available.' },
];

async function fixLegacy(admin) {
	for (const fix of LEGACY_FIXES) {
		if (getState(`legacyfix:${fix._id}`)) continue;
		try {
			await gql('mutation($i:CarUpdate!){updateCarByAdmin(input:$i){_id}}', { i: fix }, admin.token);
			setState(`legacyfix:${fix._id}`, true);
			log(`cars: legacy listing ${fix._id} specs fixed`);
		} catch (err) {
			if (/No data|not found/i.test(err.message)) setState(`legacyfix:${fix._id}`, 'absent');
			else log(`cars: legacy fix ${fix._id} failed: ${err.message}`);
		}
	}
}

export async function run() {
	const admin = await adminSession();
	if (admin && !isDry()) await fixLegacy(admin);
	const catalog = buildCatalog();
	// Sync state with what each seller already has (state may be lost).
	const known = new Map();
	for (const nick of [...new Set(catalog.map((c) => c.seller))]) {
		const creds = getState(`member:${nick}`);
		if (!creds) continue;
		const s = await login(nick, creds.password);
		let page = 1;
		while (true) {
			const d = await gql('query($i:AgentCarsInquiry!){getAgentCars(input:$i){list{_id carTitle carStatus}}}', { i: { page, limit: 100, search: {} } }, s.token);
			for (const car of d.getAgentCars.list) known.set(`${nick}|${car.carTitle}`, car._id);
			if (d.getAgentCars.list.length < 100) break;
			page++;
		}
	}
	// Without admin the brand catalog cannot grow; cars of missing brands are
	// left for a later run (same keys, so nothing is duplicated).
	const catalogBrands = new Set((await gql('{getCarBrandsByUser{carBrandName}}')).getCarBrandsByUser.map((b) => b.carBrandName));
	let created = 0, skipped = 0, noPhoto = 0, noBrand = 0;
	for (const c of catalog) {
		const title = titleOf(c);
		if (!catalogBrands.has(c.brand.key)) {
			noBrand++;
			continue;
		}
		const stateKey = `car:${c.key}`;
		const existingId = getState(stateKey)?.id || known.get(`${c.seller}|${title}`);
		if (existingId) {
			if (!getState(stateKey)) setState(stateKey, { id: existingId, seller: c.seller, title, brand: c.brand.key, model: c.model.name, year: c.year, sale: !!c.sale });
			skipped++;
			continue;
		}
		const files = await photosFor(c);
		if (files.length < 2) {
			noPhoto++;
			log(`cars: fewer than 2 usable photos for ${c.brand.display} ${c.model.name}, skipping`);
			continue;
		}
		if (isDry()) {
			log(`cars: [dry] ${title} ${c.price} USD ${files.length} photos`);
			continue;
		}
		const creds = getState(`member:${c.seller}`);
		const s = await login(c.seller, creds.password);
		let images;
		try {
			images = await upload(files, 'car', s.token);
		} catch (err) {
			log(`cars: upload failed for ${title}: ${err.message}`);
			continue;
		}
		const input = {
			carType: c.model.type,
			carBrand: c.brand.key,
			carModel: c.model.name,
			carLocation: c.city,
			carAddress: c.address,
			carFuelType: c.fuel,
			carTransmission: c.transmission,
			carTitle: title,
			carPrice: c.price,
			carSeats: c.seats,
			carOptions: c.options,
			carColor: c.color,
			carMileage: c.km,
			carImages: images,
			carImageCredits: [...new Set(files.map((f) => f.credit))],
			manufacturedAt: c.year,
			carDesc: descriptionOf(c),
			carBarter: c.barter,
			carRent: c.rent,
			carCondition: c.condition,
			carVin: c.vin,
			...saleFields(c),
		};
		try {
			const d = await gql('mutation($i:CarInput!){createCar(input:$i){_id}}', { i: input }, s.token);
			setState(stateKey, { id: d.createCar._id, seller: c.seller, title, brand: c.brand.key, model: c.model.name, year: c.year, sale: !!c.sale });
			created++;
			log(`cars: ${created}/${TARGET} ${title} (${images.length} photos, ${c.price} USD${c.sale ? ', hot deal' : ''})`);
		} catch (err) {
			log(`cars: create failed for ${title}: ${err.message}`);
		}
	}
	log(`cars: created ${created}, already present ${skipped}, no photos ${noPhoto}, brand not in catalog ${noBrand}`);
}

if (process.argv[1].endsWith('03-cars.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
