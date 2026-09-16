import { gql, adminSession, log, isDry } from './lib/api.mjs';
import { NOTICES, FAQS, TERMS } from './data/cs.mjs';

// Notices, FAQ and terms (admin only). Existing titles are left untouched.
export async function run() {
	const admin = await adminSession();
	if (!admin) {
		log('cs: no admin session, skipping notices/FAQ/terms');
		return;
	}
	const have = new Set();
	for (const cat of ['NOTICE', 'FAQ', 'TERMS']) {
		for (let page = 1; page < 10; page++) {
			const d = await gql('query($i:AllNoticesInquiry!){getAllNotices(input:$i){list{noticeTitle noticeCategory}}}', { i: { page, limit: 100, noticeCategory: cat } }, admin.token);
			for (const n of d.getAllNotices.list) have.add(`${n.noticeCategory}|${n.noticeTitle}`);
			if (d.getAllNotices.list.length < 100) break;
		}
	}
	const items = [
		...NOTICES.map((n) => ({ cat: 'NOTICE', title: n.title, content: n.content })),
		...FAQS.map((f) => ({ cat: 'FAQ', title: f.q, content: f.a })),
		...TERMS.map((t) => ({ cat: 'TERMS', title: t.title, content: t.content })),
	];
	let created = 0;
	for (const it of items) {
		if (have.has(`${it.cat}|${it.title}`)) continue;
		if (isDry()) continue;
		await gql('mutation($i:NoticeInput!){createNotice(input:$i){_id}}', { i: { noticeCategory: it.cat, noticeTitle: it.title, noticeContent: it.content, noticeStatus: 'ACTIVE' } }, admin.token);
		created++;
	}
	log(`cs: ${created} notices/FAQ/terms created (${items.length - created} already present)`);
}

if (process.argv[1].endsWith('08-cs.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
