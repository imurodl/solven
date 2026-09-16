import fs from 'node:fs';
import path from 'node:path';
import { fetchBuffer } from './api.mjs';

// Wikimedia Commons photo sourcing: free-licence bitmaps only, attribution kept.
const CACHE_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'cache', 'commons.json');
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
const save = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
const UA = 'SolvenSeed/1.0 (https://solven.uz)';
let lastCall = 0;
const pace = async () => {
	const wait = 1100 - (Date.now() - lastCall);
	if (wait > 0) await new Promise((r) => setTimeout(r, wait));
	lastCall = Date.now();
};

const FREE = /^(CC0|CC BY(-SA)?( \d\.\d)?|Public domain|CC-BY(-SA)?|Attribution|GFDL|CC BY-SA \d|CC BY \d)/i;
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const BAD = /(logo|badge|emblem|crash|wreck|accident|police|ambulance|toy|scale model|lego|diecast|brochure|drawing|sketch|map|\.svg|advert|poster|race ?car|rally|hearse|taxi|bus\b|concept|prototype|cutaway|chassis|engine bay|wheel\b|badge|nameplate|tail ?light|headlight)/i;

export async function searchCommons(query, { limit = 40, minWidth = 900 } = {}) {
	const key = `${query}|${limit}|${minWidth}`;
	if (cache[key]) return cache[key].filter((img) => !BAD.test(img.title)); // filter rules may tighten after caching
	await pace();
	const url = new URL('https://commons.wikimedia.org/w/api.php');
	url.search = new URLSearchParams({
		action: 'query',
		format: 'json',
		generator: 'search',
		gsrsearch: `${query} filetype:bitmap`,
		gsrnamespace: '6',
		gsrlimit: String(limit),
		prop: 'imageinfo',
		iiprop: 'url|size|extmetadata|mime',
		iiurlwidth: '1280',
		iiextmetadatafilter: 'LicenseShortName|Artist|Credit|ImageDescription',
	}).toString();
	const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
	const json = res?.ok ? await res.json().catch(() => ({})) : {};
	const pages = Object.values(json?.query?.pages || {});
	const out = [];
	for (const p of pages) {
		const ii = p.imageinfo?.[0];
		if (!ii) continue;
		const meta = ii.extmetadata || {};
		const licence = meta.LicenseShortName?.value || '';
		if (!FREE.test(licence) || /NC|ND/i.test(licence)) continue;
		if (!/^image\/(jpeg|png)$/.test(ii.mime)) continue;
		if ((ii.width || 0) < minWidth) continue;
		const title = p.title.replace(/^File:/, '');
		if (BAD.test(title)) continue;
		out.push({
			title,
			url: ii.thumburl || ii.url,
			width: ii.width,
			height: ii.height,
			licence,
			artist: strip(meta.Artist?.value || meta.Credit?.value || 'Unknown').slice(0, 80),
			desc: strip(meta.ImageDescription?.value || '').slice(0, 160),
		});
	}
	cache[key] = out;
	save();
	return out;
}

export const credit = (img) => `${img.artist || 'Unknown'} / Wikimedia Commons / ${img.licence}`;

export async function downloadImage(img) {
	const buf = await fetchBuffer(img.url);
	if (!buf || buf.length < 20_000) return null;
	const type = img.url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
	return { buffer: buf, filename: img.title.replace(/[^\w.-]+/g, '_').slice(0, 80), type };
}

// Brand logos: Commons only hosts free content, so any hit is usable. SVG
// originals are served as PNG thumbnails via iiurlwidth.
export async function searchLogo(brand) {
	const key = `logo|${brand}`;
	if (cache[key]) return cache[key];
	await pace();
	const url = new URL('https://commons.wikimedia.org/w/api.php');
	url.search = new URLSearchParams({
		action: 'query',
		format: 'json',
		generator: 'search',
		gsrsearch: `"${brand}" logo`,
		gsrnamespace: '6',
		gsrlimit: '20',
		prop: 'imageinfo',
		iiprop: 'url|size|mime|extmetadata',
		iiurlwidth: '480',
		iiextmetadatafilter: 'LicenseShortName|Artist',
	}).toString();
	const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
	const json = res?.ok ? await res.json().catch(() => ({})) : {};
	const pages = Object.values(json?.query?.pages || {});
	const hits = [];
	for (const p of pages) {
		const ii = p.imageinfo?.[0];
		if (!ii?.thumburl) continue;
		const title = p.title.replace(/^File:/, '');
		if (!/logo/i.test(title) || !new RegExp(brand.split(' ')[0], 'i').test(title)) continue;
		if (/(old|19\d\d|200\d|wordmark only|flag|map|badge|building|dealer|f1|racing|motorsport|team|bank|insurance|typeface)/i.test(title)) continue;
		hits.push({ title, url: ii.thumburl, mime: ii.mime, width: ii.width, licence: ii.extmetadata?.LicenseShortName?.value || '' });
	}
	// Prefer SVG originals (crisp), then wide/short shapes typical of wordmarks.
	hits.sort((a, b) => (b.mime === 'image/svg+xml') - (a.mime === 'image/svg+xml'));
	cache[key] = hits.slice(0, 5);
	save();
	return cache[key];
}
