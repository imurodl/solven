import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponValidation } from '../../libs/dto/coupon/coupon';
import { CouponInput, CouponUpdate } from '../../libs/dto/coupon/coupon.input';
import { CouponStatus, CouponType } from '../../libs/enums/coupon.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class CouponService {
	private readonly logger = new Logger(CouponService.name);

	constructor(@InjectModel('Coupon') private readonly couponModel: Model<Coupon>) {}

	// Read-only check used by checkout's "Apply" button.
	public async validateCoupon(code: string, orderTotal: number): Promise<CouponValidation> {
		const fail = (message: string): CouponValidation => ({
			valid: false,
			message,
			discountAmount: 0,
			finalTotal: orderTotal,
		});

		const coupon = await this.couponModel.findOne({ couponCode: code.trim().toUpperCase() }).exec();
		if (!coupon) return fail(Message.COUPON_NOT_FOUND);
		if (coupon.couponStatus !== CouponStatus.ACTIVE) return fail(Message.COUPON_INACTIVE);
		if (coupon.validUntil && coupon.validUntil.getTime() < Date.now()) return fail(Message.COUPON_EXPIRED);
		if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return fail(Message.COUPON_LIMIT_REACHED);
		if (orderTotal < (coupon.minOrderAmount || 0)) return fail(Message.COUPON_MIN_ORDER);

		const discountAmount = this.calcDiscount(coupon, orderTotal);
		return {
			valid: true,
			message: 'Coupon applied',
			discountAmount,
			finalTotal: Math.max(0, orderTotal - discountAmount),
			couponCode: coupon.couponCode,
		};
	}

	// Atomic redemption at order time: usedCount is incremented only while it is
	// still below maxUses, so two concurrent orders cannot both take the last use.
	public async redeemCoupon(code: string, orderTotal: number): Promise<{ discountAmount: number; couponCode: string }> {
		const check = await this.validateCoupon(code, orderTotal);
		if (!check.valid) throw new BadRequestException(check.message);

		const redeemed = await this.couponModel
			.findOneAndUpdate(
				{
					couponCode: check.couponCode,
					couponStatus: CouponStatus.ACTIVE,
					$or: [{ maxUses: 0 }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }],
				},
				{ $inc: { usedCount: 1 } },
				{ new: true },
			)
			.exec();
		if (!redeemed) throw new BadRequestException(Message.COUPON_LIMIT_REACHED);

		return { discountAmount: check.discountAmount, couponCode: check.couponCode as string };
	}

	// Compensating action when an order fails after redemption.
	public async releaseCoupon(code: string): Promise<void> {
		await this.couponModel.updateOne({ couponCode: code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).exec();
	}

	public calcDiscount(coupon: Pick<Coupon, 'couponType' | 'couponValue'>, orderTotal: number): number {
		if (coupon.couponType === CouponType.PERCENT) {
			return Math.round((orderTotal * Math.min(coupon.couponValue, 100)) / 100);
		}
		return Math.min(coupon.couponValue, orderTotal);
	}

	/** ADMIN **/

	public async createCoupon(input: CouponInput): Promise<Coupon> {
		if (input.couponType === CouponType.PERCENT && input.couponValue > 100) {
			throw new BadRequestException(Message.COUPON_PERCENT_RANGE);
		}
		try {
			return await this.couponModel.create({ ...input, couponCode: input.couponCode.trim().toUpperCase() });
		} catch (err: any) {
			if (err?.code === 11000) throw new BadRequestException(Message.COUPON_DUPLICATE);
			this.logger.error(`createCoupon: ${err.message}`);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateCouponByAdmin(input: CouponUpdate): Promise<Coupon> {
		const { _id, ...update } = input;
		const result = await this.couponModel.findByIdAndUpdate(_id, update, { new: true }).exec();
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getAllCouponsByAdmin(): Promise<Coupon[]> {
		return this.couponModel.find().sort({ createdAt: -1 }).exec();
	}
}
