import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CouponStatus, CouponType } from '../../enums/coupon.enum';

@InputType()
export class CouponInput {
	@IsNotEmpty()
	@Length(3, 24)
	@Field(() => String)
	couponCode: string;

	@IsNotEmpty()
	@Field(() => CouponType)
	couponType: CouponType;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Number)
	couponValue: number;

	@IsOptional()
	@Min(0)
	@Max(1000000)
	@Field(() => Int, { nullable: true })
	maxUses?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	minOrderAmount?: number;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	validUntil?: Date;
}

@InputType()
export class CouponUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => CouponStatus, { nullable: true })
	couponStatus?: CouponStatus;

	@IsOptional()
	@Min(1)
	@Field(() => Number, { nullable: true })
	couponValue?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	maxUses?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	minOrderAmount?: number;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	validUntil?: Date;
}
