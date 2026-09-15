import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CouponStatus, CouponType } from '../../enums/coupon.enum';

@ObjectType()
export class Coupon {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	couponCode: string;

	@Field(() => CouponType)
	couponType: CouponType;

	@Field(() => Float)
	couponValue: number;

	@Field(() => CouponStatus)
	couponStatus: CouponStatus;

	@Field(() => Int)
	maxUses: number;

	@Field(() => Int)
	usedCount: number;

	@Field(() => Float)
	minOrderAmount: number;

	@Field(() => Date, { nullable: true })
	validUntil?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class CouponValidation {
	@Field(() => Boolean)
	valid: boolean;

	@Field(() => String)
	message: string;

	@Field(() => Float)
	discountAmount: number;

	@Field(() => Float)
	finalTotal: number;

	@Field(() => String, { nullable: true })
	couponCode?: string;
}
