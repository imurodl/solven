import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Coupon, CouponValidation } from '../../libs/dto/coupon/coupon';
import { CouponInput, CouponUpdate } from '../../libs/dto/coupon/coupon.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Throttle } from '@nestjs/throttler';

@Resolver()
export class CouponResolver {
	private readonly logger = new Logger(CouponResolver.name);

	constructor(private readonly couponService: CouponService) {}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Query(() => CouponValidation)
	public async validateCoupon(
		@Args('code') code: string,
		@Args('orderTotal') orderTotal: number,
	): Promise<CouponValidation> {
		this.logger.log('Query: validateCoupon');
		return await this.couponService.validateCoupon(code, orderTotal);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Coupon)
	public async createCoupon(@Args('input') input: CouponInput): Promise<Coupon> {
		this.logger.log('Mutation: createCoupon');
		return await this.couponService.createCoupon(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Coupon)
	public async updateCouponByAdmin(@Args('input') input: CouponUpdate): Promise<Coupon> {
		this.logger.log('Mutation: updateCouponByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.couponService.updateCouponByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => [Coupon])
	public async getAllCouponsByAdmin(): Promise<Coupon[]> {
		this.logger.log('Query: getAllCouponsByAdmin');
		return await this.couponService.getAllCouponsByAdmin();
	}
}
