import { gql, adminSession, log, isDry } from './lib/api.mjs';

const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
const COUPONS = [
	{ couponCode: 'WELCOME10', couponType: 'PERCENT', couponValue: 10, minOrderAmount: 5000, maxUses: 100, validUntil: days(180) },
	{ couponCode: 'SOLVEN500', couponType: 'FIXED', couponValue: 500, minOrderAmount: 10000, maxUses: 50, validUntil: days(90) },
	{ couponCode: 'HOTDEAL5', couponType: 'PERCENT', couponValue: 5, minOrderAmount: 0, maxUses: 200, validUntil: days(30) },
	{ couponCode: 'EXPORT300', couponType: 'FIXED', couponValue: 300, minOrderAmount: 8000, maxUses: 40, validUntil: days(120), pause: true },
];

export async function run() {
	const admin = await adminSession();
	if (!admin) {
		log('coupons: no admin session, skipping');
		return;
	}
	const have = (await gql('{getAllCouponsByAdmin{_id couponCode couponStatus}}', {}, admin.token)).getAllCouponsByAdmin;
	let created = 0;
	for (const c of COUPONS) {
		const { pause, ...input } = c;
		let row = have.find((h) => h.couponCode === c.couponCode);
		if (!row) {
			if (isDry()) continue;
			const d = await gql('mutation($i:CouponInput!){createCoupon(input:$i){_id couponStatus}}', { i: input }, admin.token);
			row = d.createCoupon;
			created++;
		}
		if (pause && row.couponStatus !== 'PAUSED' && !isDry()) {
			await gql('mutation($i:CouponUpdate!){updateCouponByAdmin(input:$i){_id}}', { i: { _id: row._id, couponStatus: 'PAUSED' } }, admin.token);
		}
	}
	log(`coupons: ${created} created, ${COUPONS.length} defined`);
}

if (process.argv[1].endsWith('09-coupons.mjs')) run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
