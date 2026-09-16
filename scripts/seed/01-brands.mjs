import { gql, upload, adminSession, log, isDry } from './lib/api.mjs';
import { searchLogo } from './lib/commons.mjs';
import { fetchBuffer } from './lib/api.mjs';
import { logoToJpeg, wordmark } from './lib/images.mjs';
import { BRANDS } from './data/brands.mjs';

// Known-good Commons logo files; the generic "<brand> logo" search is
// ambiguous for several brands (Sega Genesis, Cadillac Fairview...).
const LOGO_FILES = {
	GENESIS: 'Genesis logo.svg',
	LEXUS: 'Lexus logo.svg',
	HONDA: 'Honda Logo.svg',
	VOLKSWAGEN: 'Volkswagen logo 2019.svg',
	PORSCHE: 'Porsche wordmark.svg',
	VOLVO: 'Volvo logo.svg',
	FORD: 'Ford logo flat.svg',
	NISSAN: 'Nissan 2020 logo.svg',
	MAZDA: 'Mazda logo.svg',
	'LAND ROVER': 'Land Rover 2023.svg',
	MINI: 'MINI logo.svg',
	JEEP: 'Jeep logo.svg',
	PEUGEOT: 'Peugeot logo.svg',
	CADILLAC: 'Cadillac Logo 2021.svg',
	JAGUAR: 'Jaguar 2024.svg',
	MASERATI: 'Maserati logo 2.svg',
	SUBARU: 'Subaru Logo.svg',
	POLESTAR: 'Polestar Logo.svg',
	BYD: 'BYD Auto Logo.svg',
	KGM: 'KGM logo.svg',
};

async function thumbFor(fileTitle) {
	const url = new URL('https://commons.wikimedia.org/w/api.php');
	url.search = new URLSearchParams({ action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url', iiurlwidth: '480', titles: `File:${fileTitle}` }).toString();
	const res = await fetch(url, { headers: { 'User-Agent': 'SolvenSeed/1.0 (https://solven.uz)' } }).catch(() => null);
	const json = res?.ok ? await res.json().catch(() => ({})) : {};
	const page = Object.values(json?.query?.pages || {})[0];
	return page?.imageinfo?.[0]?.thumburl || null;
}

// Create missing brands with logos, and add missing models to existing ones.
export async function run() {
	const admin = await adminSession();
	if (!admin) {
		log('brands: no admin session (SEED_ADMIN_NICK/PASS), skipping');
		return;
	}
	const existing = (await gql('{getCarBrands{carBrandName carBrandModels carBrandStatus}}', {}, admin.token)).getCarBrands;
	const byName = new Map(existing.map((b) => [b.carBrandName, b]));
	for (const brand of BRANDS) {
		const models = brand.models.map((m) => m.name);
		const have = byName.get(brand.key);
		if (!have) {
			let buffer = null;
			const hits = [];
			if (LOGO_FILES[brand.key]) {
				const url = await thumbFor(LOGO_FILES[brand.key]);
				if (url) hits.push({ title: LOGO_FILES[brand.key], url });
			}
			if (!hits.length) hits.push(...(await searchLogo(brand.display)));
			for (const hit of hits) {
				const raw = await fetchBuffer(hit.url);
				if (!raw) continue;
				try {
					buffer = await logoToJpeg(raw);
					log(`brands: ${brand.key} logo <- ${hit.title}`);
					break;
				} catch {}
			}
			if (!buffer) {
				buffer = await wordmark(brand.display);
				log(`brands: ${brand.key} wordmark fallback`);
			}
			if (isDry()) continue;
			const [img] = await upload([{ buffer, filename: `${brand.key.toLowerCase()}.jpg`, type: 'image/jpeg' }], 'car-brand', admin.token);
			await gql('mutation($i:CarBrandInput!){createCarBrand(input:$i){_id}}', { i: { carBrandName: brand.key, carBrandImg: img, carBrandModels: models } }, admin.token);
			log(`brands: created ${brand.key} (${models.length} models)`);
			continue;
		}
		const missing = models.filter((m) => !have.carBrandModels.includes(m));
		for (const m of missing) {
			if (isDry()) continue;
			await gql('mutation($i:CarBrandUpdate!){updateCarBrand(input:$i){_id}}', { i: { carBrandName: brand.key, carBrandModel: m } }, admin.token);
		}
		if (missing.length) log(`brands: ${brand.key} +${missing.length} models`);
		if (have.carBrandStatus !== 'ACTIVE' && !isDry()) {
			await gql('mutation($i:CarBrandUpdate!){updateCarBrand(input:$i){_id}}', { i: { carBrandName: brand.key, carBrandStatus: 'ACTIVE' } }, admin.token);
		}
	}
}

if (process.argv[1].endsWith('01-brands.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
