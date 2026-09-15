import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CouponService } from '../coupon/coupon.service';
import { TelegramNotifyService } from './telegram-notify.service';
import { MailNotifyService } from './mail-notify.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';
import { DeliveryMethod, OrderStatus } from '../../libs/enums/order.enum';
import { CarAvailability, CarStatus } from '../../libs/enums/car.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });
const leanExec = (value: any) => ({ lean: () => execWith(value) });

const BUYER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const SELLER = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CAR = 'cccccccccccccccccccccccc';

describe('OrderService', () => {
	let service: OrderService;
	let orderModel: any;
	let carModel: any;
	let couponService: any;
	let notificationService: any;
	let socketGateway: any;

	const buyer = { _id: BUYER, memberType: MemberType.USER } as any;
	const seller = { _id: SELLER, memberType: MemberType.AGENT } as any;
	const admin = { _id: 'dddddddddddddddddddddddd', memberType: MemberType.ADMIN } as any;

	const car = (over: any = {}) => ({
		_id: CAR,
		memberId: SELLER,
		carStatus: CarStatus.ACTIVE,
		carAvailability: CarAvailability.AVAILABLE,
		carTitle: 'Sonata',
		carPrice: 20000,
		carImages: ['uploads/car/a.jpg'],
		...over,
	});

	const order = (over: any = {}) => ({
		_id: 'eeeeeeeeeeeeeeeeeeeeeeee',
		orderId: 'SLV-1',
		memberId: BUYER,
		sellerId: SELLER,
		carId: CAR,
		carSnapshot: { carTitle: 'Sonata', carPrice: 20000 },
		orderStatus: OrderStatus.PENDING,
		orderTotal: 20000,
		orderDeposit: 1000,
		...over,
	});

	beforeEach(async () => {
		process.env.DEMO_ORDER_FLOW = 'false';
		orderModel = {
			findOne: jest.fn(),
			findById: jest.fn(),
			findByIdAndUpdate: jest.fn(),
			findOneAndUpdate: jest.fn(),
			create: jest.fn(),
			aggregate: jest.fn(),
		};
		carModel = { findOne: jest.fn(), findByIdAndUpdate: jest.fn().mockReturnValue(execWith({})) };
		couponService = { validateCoupon: jest.fn(), redeemCoupon: jest.fn(), releaseCoupon: jest.fn() };
		notificationService = { createNotification: jest.fn().mockResolvedValue({}) };
		socketGateway = { emitToMember: jest.fn() };

		const moduleRef = await Test.createTestingModule({
			providers: [
				OrderService,
				{ provide: getModelToken('Order'), useValue: orderModel },
				{ provide: getModelToken('Car'), useValue: carModel },
				{ provide: CouponService, useValue: couponService },
				{ provide: TelegramNotifyService, useValue: { notifyMember: jest.fn(), notifyAdminNewOrder: jest.fn() } },
				{ provide: MailNotifyService, useValue: { notifyMember: jest.fn() } },
				{ provide: NotificationService, useValue: notificationService },
				{ provide: SocketGateway, useValue: socketGateway },
			],
		}).compile();
		service = moduleRef.get(OrderService);
	});

	describe('getOrderQuote', () => {
		it('uses the sale price while the sale window is open and applies the deposit rate', async () => {
			carModel.findOne.mockReturnValue(
				leanExec(car({ carIsOnSale: true, carSalePrice: 18000, carSaleExpiresAt: new Date(Date.now() + 86400000) })),
			);
			const quote = await service.getOrderQuote(BUYER as any, CAR as any);
			expect(quote).toMatchObject({ carPrice: 18000, orderTotal: 18000, orderDeposit: 900, depositRate: 0.05 });
		});

		it('ignores an expired sale and reports coupon feedback', async () => {
			carModel.findOne.mockReturnValue(
				leanExec(car({ carIsOnSale: true, carSalePrice: 18000, carSaleExpiresAt: new Date(Date.now() - 1000) })),
			);
			couponService.validateCoupon.mockResolvedValue({
				valid: true,
				discountAmount: 2000,
				couponCode: 'X',
				message: 'ok',
			});
			const quote = await service.getOrderQuote(BUYER as any, CAR as any, 'x');
			expect(quote).toMatchObject({
				carPrice: 20000,
				discountAmount: 2000,
				orderTotal: 18000,
				orderDeposit: 900,
				couponCode: 'X',
			});
		});

		it('refuses the seller quoting their own car and unavailable cars', async () => {
			carModel.findOne.mockReturnValue(leanExec(car()));
			await expect(service.getOrderQuote(SELLER as any, CAR as any)).rejects.toThrow(Message.OWN_CAR_ORDER_DENIED);
			carModel.findOne.mockReturnValue(leanExec(car({ carAvailability: CarAvailability.RESERVED })));
			await expect(service.getOrderQuote(BUYER as any, CAR as any)).rejects.toThrow(Message.CAR_NOT_AVAILABLE);
		});
	});

	describe('createOrder', () => {
		const input = () => ({
			carId: CAR as any,
			deliveryMethod: DeliveryMethod.PICKUP,
			deliveryInfo: { fullName: 'B', phone: '01011112222' },
		});

		it('snapshots the car, computes totals server-side and notifies', async () => {
			carModel.findOne.mockReturnValue(leanExec(car()));
			orderModel.findOne.mockReturnValue(execWith(null));
			orderModel.create.mockImplementation(async (doc: any) => ({ ...doc, _id: 'new' }));

			const result = await service.createOrder(BUYER as any, input());

			expect(orderModel.create).toHaveBeenCalledWith(
				expect.objectContaining({
					sellerId: SELLER,
					orderTotal: 20000,
					orderDeposit: 1000,
					orderDiscount: 0,
					carSnapshot: expect.objectContaining({ carTitle: 'Sonata', carImage: 'uploads/car/a.jpg' }),
				}),
			);
			expect(result.orderId).toMatch(/^SLV-/);
			expect(notificationService.createNotification).toHaveBeenCalledWith(
				expect.objectContaining({ receiverId: SELLER }),
			);
			expect(socketGateway.emitToMember).toHaveBeenCalledTimes(2);
		});

		it('blocks a second open order for the same car', async () => {
			carModel.findOne.mockReturnValue(leanExec(car()));
			orderModel.findOne.mockReturnValue(execWith(order()));
			await expect(service.createOrder(BUYER as any, input())).rejects.toThrow(Message.ORDER_ALREADY_OPEN);
		});

		it('requires an address for delivery orders', async () => {
			carModel.findOne.mockReturnValue(leanExec(car()));
			await expect(
				service.createOrder(BUYER as any, { ...input(), deliveryMethod: DeliveryMethod.DELIVERY }),
			).rejects.toThrow(BadRequestException);
		});

		it('redeems the coupon and releases it if persistence fails', async () => {
			carModel.findOne.mockReturnValue(leanExec(car()));
			orderModel.findOne.mockReturnValue(execWith(null));
			couponService.redeemCoupon.mockResolvedValue({ discountAmount: 2000, couponCode: 'WELCOME10' });
			orderModel.create.mockRejectedValue(new Error('db down'));
			await expect(service.createOrder(BUYER as any, { ...input(), couponCode: 'welcome10' })).rejects.toThrow(
				Message.CREATE_FAILED,
			);
			expect(couponService.releaseCoupon).toHaveBeenCalledWith('WELCOME10');
		});
	});

	describe('state machine', () => {
		const load = (doc: any) => orderModel.findById.mockReturnValue(execWith(doc));
		const updated = (status: OrderStatus) =>
			orderModel.findByIdAndUpdate.mockReturnValue(execWith(order({ orderStatus: status })));

		it('seller accept: PENDING -> ACCEPTED and reserves the car', async () => {
			load(order());
			updated(OrderStatus.ACCEPTED);
			const res = await service.respondOrder(seller, order()._id as any, true);
			expect(res.orderStatus).toBe(OrderStatus.ACCEPTED);
			expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith(CAR, { carAvailability: CarAvailability.RESERVED });
		});

		it('buyer cannot accept on behalf of the seller', async () => {
			load(order());
			await expect(service.respondOrder(buyer, order()._id as any, true)).rejects.toThrow(ForbiddenException);
		});

		it('strangers cannot touch the order', async () => {
			load(order());
			await expect(
				service.payOrderDeposit(
					{ _id: 'ffffffffffffffffffffffff', memberType: MemberType.USER } as any,
					order()._id as any,
				),
			).rejects.toThrow(Message.ORDER_NOT_PARTICIPANT);
		});

		it('pay requires ACCEPTED', async () => {
			load(order({ orderStatus: OrderStatus.PENDING }));
			await expect(service.payOrderDeposit(buyer, order()._id as any)).rejects.toThrow(
				Message.ORDER_INVALID_TRANSITION,
			);
			load(order({ orderStatus: OrderStatus.ACCEPTED }));
			updated(OrderStatus.PAID);
			expect((await service.payOrderDeposit(buyer, order()._id as any)).orderStatus).toBe(OrderStatus.PAID);
		});

		it('confirm marks the car SOLD and counts the sale', async () => {
			load(order({ orderStatus: OrderStatus.DELIVERED }));
			updated(OrderStatus.COMPLETED);
			await service.confirmOrder(buyer, order()._id as any);
			expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith(
				CAR,
				expect.objectContaining({
					$inc: { carSoldCount: 1 },
					carAvailability: CarAvailability.SOLD,
					carStatus: CarStatus.SOLD,
				}),
			);
		});

		it('admin keepListing keeps the car available', async () => {
			load(order({ orderStatus: OrderStatus.DELIVERED }));
			updated(OrderStatus.COMPLETED);
			await service.confirmOrder(admin, order()._id as any, true);
			const patch = carModel.findByIdAndUpdate.mock.calls[0][1];
			expect(patch.carAvailability).toBe(CarAvailability.AVAILABLE);
			expect(patch.carStatus).toBeUndefined();
		});

		it('seller cancel after acceptance releases the car; buyer cannot cancel once paid', async () => {
			load(order({ orderStatus: OrderStatus.PAID }));
			updated(OrderStatus.CANCELLED);
			await service.cancelOrder(seller, order()._id as any, 'no longer available');
			expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith(CAR, { carAvailability: CarAvailability.AVAILABLE });

			load(order({ orderStatus: OrderStatus.PAID }));
			await expect(service.cancelOrder(buyer, order()._id as any)).rejects.toThrow(Message.ORDER_INVALID_TRANSITION);
		});

		it('return requests only within the window', async () => {
			load(order({ orderStatus: OrderStatus.COMPLETED, completedAt: new Date(Date.now() - 10 * 86400000) }));
			await expect(service.requestReturn(buyer, order()._id as any, 'x')).rejects.toThrow(Message.RETURN_WINDOW_CLOSED);
			load(order({ orderStatus: OrderStatus.COMPLETED, completedAt: new Date() }));
			updated(OrderStatus.RETURN_REQUESTED);
			expect((await service.requestReturn(buyer, order()._id as any, 'x')).orderStatus).toBe(
				OrderStatus.RETURN_REQUESTED,
			);
		});
	});
});
