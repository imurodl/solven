import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponStatus, CouponType } from '../../libs/enums/coupon.enum';
import { Message } from '../../libs/enums/common.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CouponService', () => {
	let service: CouponService;
	let couponModel: { findOne: jest.Mock; findOneAndUpdate: jest.Mock; create: jest.Mock; updateOne: jest.Mock };

	const coupon = (over: any = {}) => ({
		couponCode: 'WELCOME10',
		couponType: CouponType.PERCENT,
		couponValue: 10,
		couponStatus: CouponStatus.ACTIVE,
		maxUses: 0,
		usedCount: 0,
		minOrderAmount: 0,
		validUntil: undefined,
		...over,
	});

	beforeEach(async () => {
		couponModel = { findOne: jest.fn(), findOneAndUpdate: jest.fn(), create: jest.fn(), updateOne: jest.fn() };
		const moduleRef = await Test.createTestingModule({
			providers: [CouponService, { provide: getModelToken('Coupon'), useValue: couponModel }],
		}).compile();
		service = moduleRef.get(CouponService);
	});

	describe('validateCoupon', () => {
		it('normalises the code and computes a percent discount', async () => {
			couponModel.findOne.mockReturnValue(execWith(coupon()));
			const res = await service.validateCoupon('  welcome10 ', 20000);
			expect(couponModel.findOne).toHaveBeenCalledWith({ couponCode: 'WELCOME10' });
			expect(res).toMatchObject({ valid: true, discountAmount: 2000, finalTotal: 18000, couponCode: 'WELCOME10' });
		});

		it('caps a fixed discount at the order total', async () => {
			couponModel.findOne.mockReturnValue(execWith(coupon({ couponType: CouponType.FIXED, couponValue: 5000 })));
			const res = await service.validateCoupon('X', 3000);
			expect(res.discountAmount).toBe(3000);
			expect(res.finalTotal).toBe(0);
		});

		it.each([
			[null, Message.COUPON_NOT_FOUND],
			[coupon({ couponStatus: CouponStatus.PAUSED }), Message.COUPON_INACTIVE],
			[coupon({ validUntil: new Date(Date.now() - 1000) }), Message.COUPON_EXPIRED],
			[coupon({ maxUses: 5, usedCount: 5 }), Message.COUPON_LIMIT_REACHED],
			[coupon({ minOrderAmount: 50000 }), Message.COUPON_MIN_ORDER],
		])('rejects invalid coupons with a reason', async (doc, message) => {
			couponModel.findOne.mockReturnValue(execWith(doc));
			const res = await service.validateCoupon('X', 20000);
			expect(res.valid).toBe(false);
			expect(res.message).toBe(message);
			expect(res.finalTotal).toBe(20000);
		});
	});

	describe('redeemCoupon', () => {
		it('increments usedCount atomically with a usage guard', async () => {
			couponModel.findOne.mockReturnValue(execWith(coupon({ maxUses: 10, usedCount: 3 })));
			couponModel.findOneAndUpdate.mockReturnValue(execWith(coupon({ usedCount: 4 })));
			const res = await service.redeemCoupon('WELCOME10', 10000);
			expect(res).toEqual({ discountAmount: 1000, couponCode: 'WELCOME10' });
			const [filter, update] = couponModel.findOneAndUpdate.mock.calls[0];
			expect(filter.$or).toEqual([{ maxUses: 0 }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }]);
			expect(update).toEqual({ $inc: { usedCount: 1 } });
		});

		it('throws when the guarded update finds nothing (race lost)', async () => {
			couponModel.findOne.mockReturnValue(execWith(coupon({ maxUses: 10, usedCount: 9 })));
			couponModel.findOneAndUpdate.mockReturnValue(execWith(null));
			await expect(service.redeemCoupon('WELCOME10', 10000)).rejects.toThrow(Message.COUPON_LIMIT_REACHED);
		});

		it('throws the validation message for an invalid coupon', async () => {
			couponModel.findOne.mockReturnValue(execWith(null));
			await expect(service.redeemCoupon('NOPE', 10)).rejects.toThrow(BadRequestException);
		});
	});

	describe('createCoupon', () => {
		it('rejects percent values above 100', async () => {
			await expect(
				service.createCoupon({ couponCode: 'a', couponType: CouponType.PERCENT, couponValue: 120 }),
			).rejects.toThrow(Message.COUPON_PERCENT_RANGE);
		});

		it('maps duplicate key errors to a friendly message', async () => {
			couponModel.create.mockRejectedValue({ code: 11000 });
			await expect(
				service.createCoupon({ couponCode: 'dup', couponType: CouponType.FIXED, couponValue: 5 }),
			).rejects.toThrow(Message.COUPON_DUPLICATE);
		});
	});
});
