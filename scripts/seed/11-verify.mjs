import { gql, log } from './lib/api.mjs';

// Public-API snapshot of what the seed produced.
export async function run() {
	const q = `{
		all: getCars(input:{page:1,limit:1,search:{}}){metaCounter{total}}
		sale: getCars(input:{page:1,limit:50,search:{carIsOnSale:true}}){list{carTitle carSaleExpiresAt} metaCounter{total}}
		agents: getAgents(input:{page:1,limit:100,search:{}}){list{memberNick memberCars memberRating memberReviews} metaCounter{total}}
		mechanics: getMechanics(input:{page:1,limit:20,search:{}}){metaCounter{total}}
		jobs: getServiceJobs(input:{page:1,limit:1,search:{}}){metaCounter{total}}
		articles: getBoardArticles(input:{page:1,limit:1,search:{}}){metaCounter{total}}
		brands: getCarBrandsByUser{carBrandName}
		activity: getRecentActivity(limit:5){type title}
	}`;
	const d = await gql(q);
	const total = (x) => x.metaCounter?.[0]?.total ?? 0;
	log(`verify: cars ${total(d.all)} (on sale ${total(d.sale)}), agents ${total(d.agents)}, mechanics ${total(d.mechanics)}, service jobs ${total(d.jobs)}, articles ${total(d.articles)}, brands ${d.brands.length}`);
	const thin = d.agents.list.filter((a) => (a.memberCars || 0) < 3).map((a) => a.memberNick);
	if (thin.length) log(`verify: agents with < 3 cars: ${thin.join(', ')}`);
	const rated = d.agents.list.filter((a) => a.memberReviews > 0).length;
	log(`verify: ${rated} agents have reviews`);
	const expired = d.sale.list.filter((c) => new Date(c.carSaleExpiresAt) < new Date()).length;
	if (expired) log(`verify: ${expired} hot deals already expired`);
	log(`verify: recent activity -> ${d.activity.map((a) => `${a.type}: ${a.title}`).join(' | ')}`);
}

if (process.argv[1].endsWith('11-verify.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
