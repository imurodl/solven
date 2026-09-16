import { gql, upload, login, getState, setState, log, isDry } from './lib/api.mjs';
import { rng } from './lib/random.mjs';
import { searchCommons, downloadImage } from './lib/commons.mjs';
import { isValidImage } from './lib/images.mjs';
import { SERVICE_JOBS } from './data/service.mjs';
import { USERS } from './02-members.mjs';

const JOB_COMMENTS = [
	'Great work, how long did it take?', 'Do you do the same for a Sportage?', 'What was the total with parts?', 'Looks brand new.',
	'Booked you for next week after seeing this.', 'Can you send me a quote for the same job?', '깔끔하네요. 견적 문의드립니다.', 'Qancha turadi shu ish?',
];

async function photosFor(job, token) {
	const pool = await searchCommons(job.photos, { limit: 30, minWidth: 800 });
	const files = [];
	for (const img of pool.slice(0, 6)) {
		if (files.length >= 3) break;
		const f = await downloadImage(img);
		if (f && (await isValidImage(f.buffer))) files.push(f);
	}
	if (!files.length) {
		// Fall back to a photo of the car model itself.
		const alt = await searchCommons(`"${job.brand === 'BENZ' ? 'Mercedes-Benz' : job.brand.charAt(0) + job.brand.slice(1).toLowerCase()} ${job.model}"`, { limit: 20 });
		for (const img of alt.slice(0, 3)) {
			const f = await downloadImage(img);
			if (f && (await isValidImage(f.buffer))) files.push(f);
		}
	}
	if (!files.length) return [];
	return upload(files, 'service', token);
}

export async function run() {
	const r = rng(606);
	let created = 0;
	for (const job of SERVICE_JOBS) {
		const key = `job:${job.mech}|${job.title}`;
		if (getState(key)) continue;
		const creds = getState(`member:${job.mech}`);
		if (!creds) {
			log(`service: mechanic ${job.mech} missing, run 02-members`);
			continue;
		}
		const s = await login(job.mech, creds.password);
		// Sync with the API in case state was lost.
		const mine = await gql('query($i:ServiceJobsInquiry!){getMechanicServiceJobs(input:$i){list{_id serviceTitle}}}', { i: { page: 1, limit: 100, search: {} } }, s.token);
		const existing = mine.getMechanicServiceJobs.list.find((j) => j.serviceTitle === job.title);
		if (existing) {
			setState(key, { id: existing._id });
			continue;
		}
		if (isDry()) {
			log(`service: [dry] ${job.title}`);
			continue;
		}
		const images = await photosFor(job, s.token);
		if (!images.length) {
			log(`service: no photos for ${job.title}, skipping`);
			continue;
		}
		try {
			const d = await gql(
				'mutation($i:ServiceJobInput!){createServiceJob(input:$i){_id}}',
				{ i: { serviceType: job.type, serviceTitle: job.title, serviceDesc: job.desc, carBrand: job.brand, carModel: job.model, manufacturedAt: job.year, servicePrice: job.price, serviceDuration: job.hours, serviceImages: images, serviceLocation: job.loc, serviceAddress: job.addr } },
				s.token,
			);
			setState(key, { id: d.createServiceJob._id });
			created++;
			log(`service: ${job.title}`);
		} catch (err) {
			log(`service: create failed ${job.title}: ${err.message}`);
		}
	}
	// Likes, views and a few comments from buyers.
	let likes = 0;
	for (const u of USERS) {
		if (getState(`jobs-engaged:${u.nick}`) || isDry()) continue;
		const creds = getState(`member:${u.nick}`);
		if (!creds) continue;
		const s = await login(u.nick, creds.password);
		const jobs = SERVICE_JOBS.map((j) => getState(`job:${j.mech}|${j.title}`)?.id).filter(Boolean);
		for (const id of r.sample(jobs, r.int(0, 5))) {
			try {
				const d = await gql('query($id:String!){getServiceJob(serviceJobId:$id){_id meLiked{myFavorite}}}', { id }, s.token);
				if (!d.getServiceJob.meLiked?.[0]?.myFavorite && r.chance(0.5)) {
					await gql('mutation($id:String!){likeTargetServiceJob(serviceJobId:$id){_id}}', { id }, s.token);
					likes++;
				}
				if (r.chance(0.15)) await gql('mutation($i:CommentInput!){createComment(input:$i){_id}}', { i: { commentGroup: 'SERVICE_JOB', commentRefId: id, commentContent: r.pick(JOB_COMMENTS) } }, s.token);
			} catch (err) {
				log(`service: engagement ${u.nick}: ${err.message}`);
			}
		}
		setState(`jobs-engaged:${u.nick}`, true);
	}
	log(`service: created ${created}, likes ${likes}`);
}

if (process.argv[1].endsWith('06-service.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
