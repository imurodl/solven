import { Schema } from 'mongoose';
import { CouponStatus, CouponType } from '../libs/enums/coupon.enum';

const CouponSchema = new Schema(
	{
		couponCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
		couponType: { type: String, enum: CouponType, required: true },
		couponValue: { type: Number, required: true }, // PERCENT: 1-100, FIXED: amount in USD
		couponStatus: { type: String, enum: CouponStatus, default: CouponStatus.ACTIVE },
		maxUses: { type: Number, default: 0 }, // 0 = unlimited
		usedCount: { type: Number, default: 0 },
		minOrderAmount: { type: Number, default: 0 },
		validUntil: { type: Date },
	},
	{ timestamps: true, collection: 'coupons' },
);

export default CouponSchema;
