// Runs every seed step in order. Usage:
//   SEED_API=https://api.solven.uz/graphql SEED_STATE=scripts/seed/state.prod.json \
//   SEED_ADMIN_NICK=... SEED_ADMIN_PASS=... node scripts/seed/run-all.mjs [--from=05] [--dry]
import { log } from './lib/api.mjs';

const STEPS = ['01-brands', '02-members', '03-cars', '04-engagement', '05-deals', '06-service', '07-articles', '08-cs', '09-coupons', '10-messages', '12-restagger', '11-verify'];
const from = (process.argv.find((a) => a.startsWith('--from=')) || '--from=01').slice(7);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);

for (const step of STEPS) {
	if (only ? !step.startsWith(only) : step < from) continue;
	log(`==== ${step}`);
	const mod = await import(`./${step}.mjs`);
	await mod.run();
}
log('==== done');
process.exit(0);
