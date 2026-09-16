import { gql, upload, login, getState, setState, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { searchCommons, downloadImage } from './lib/commons.mjs';
import { isValidImage } from './lib/images.mjs';
import { ARTICLES } from './data/articles.mjs';
import { AGENTS } from './data/people.mjs';
import { USERS } from './02-members.mjs';

const ARTICLE_COMMENTS = [
	'Great write-up, thanks.', 'Saved this for later.', 'Disagree on the diesel point but good article.', 'Exactly my experience.', 'Could you do one about insurance next?',
	'This should be pinned.', 'I learned this the hard way last year.', 'Very useful for newcomers.', '좋은 글 감사합니다.', '공감합니다.', 'Rahmat, foydali maqola.', 'Спасибо, полезно.',
];

export async function run() {
	const r = rng(707);
	const authors = [...USERS.map((u) => u.nick), ...AGENTS.map((a) => a.nick)];
	let created = 0;
	for (const [i, art] of ARTICLES.entries()) {
		const key = `article:${art.title}`;
		if (getState(key)) continue;
		// Check the API first (state may be lost).
		const found = await gql('query($i:BoardArticlesInquiry!){getBoardArticles(input:$i){list{_id articleTitle}}}', { i: { page: 1, limit: 5, search: { text: art.title.slice(0, 40) } } });
		const hit = found.getBoardArticles.list.find((a) => a.articleTitle === art.title);
		if (hit) {
			setState(key, { id: hit._id });
			continue;
		}
		const authorNick = art.title.startsWith('Solven now') && getState('member:Max') ? 'Max' : authors[(i * 7) % authors.length];
		const creds = getState(`member:${authorNick}`);
		if (!creds) continue;
		const s = await login(authorNick, creds.password);
		if (isDry()) {
			log(`articles: [dry] ${art.title} by ${authorNick}`);
			continue;
		}
		let articleImage;
		const pool = await searchCommons(art.cover, { limit: 20, minWidth: 900 });
		for (const img of pool.slice(0, 4)) {
			const f = await downloadImage(img);
			if (f && (await isValidImage(f.buffer))) {
				try {
					[articleImage] = await upload([f], 'article', s.token);
					break;
				} catch {}
			}
		}
		try {
			const d = await gql('mutation($i:BoardArticleInput!){createBoardArticle(input:$i){_id}}', { i: { articleCategory: art.cat, articleTitle: art.title, articleContent: art.body, articleImage } }, s.token);
			setState(key, { id: d.createBoardArticle._id });
			created++;
			log(`articles: ${art.title} (${authorNick})`);
		} catch (err) {
			log(`articles: create failed "${art.title}": ${err.message}`);
		}
	}
	// Readers: views, likes and comments.
	let likes = 0, comments = 0;
	const ids = ARTICLES.map((a) => getState(`article:${a.title}`)?.id).filter(Boolean);
	for (const u of USERS) {
		if (getState(`articles-engaged:${u.nick}`) || isDry() || !ids.length) continue;
		const creds = getState(`member:${u.nick}`);
		if (!creds) continue;
		const s = await login(u.nick, creds.password);
		for (const id of r.sample(ids, r.int(2, 10))) {
			try {
				const d = await gql('query($id:String!){getBoardArticle(articleId:$id){_id meLiked{myFavorite}}}', { id }, s.token);
				if (!d.getBoardArticle.meLiked?.[0]?.myFavorite && r.chance(0.4)) {
					await gql('mutation($id:String!){likeTargetBoardArticle(articleId:$id){_id}}', { id }, s.token);
					likes++;
				}
				if (r.chance(0.2)) {
					await gql('mutation($i:CommentInput!){createComment(input:$i){_id}}', { i: { commentGroup: 'ARTICLE', commentRefId: id, commentContent: r.pick(ARTICLE_COMMENTS) } }, s.token);
					comments++;
				}
			} catch (err) {
				log(`articles: engagement ${u.nick}: ${err.message}`);
			}
		}
		setState(`articles-engaged:${u.nick}`, true);
	}
	log(`articles: created ${created}, likes ${likes}, comments ${comments}`);
}

if (process.argv[1].endsWith('07-articles.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
