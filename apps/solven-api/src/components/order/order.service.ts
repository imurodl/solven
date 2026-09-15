import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Order, OrderQuote, Orders } from '../../libs/dto/order/order';
import { OrderInput, OrdersInquiry, OrderUpdate } from '../../libs/dto/order/order.input';
import { DeliveryMethod, OrderStatus } from '../../libs/enums/order.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CarAvailability, CarStatus } from '../../libs/enums/car.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { CouponService } from '../coupon/coupon.service';
import { TelegramNotifyService } from './telegram-notify.service';
import { MailNotifyService } from './mail-notify.service';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';

const OPEN_STATUSES = [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PAID, OrderStatus.DELIVERED];
const RETURN_WINDOW_DAYS = 7;

type Actor = { _id: ObjectId; memberType: MemberType };

// Which status each action may start from. Anything else is an invalid transition.
const TRANSITIONS: Record<string, OrderStatus[]> = {
	accept: [OrderStatus.PENDING],
	decline: [OrderStatus.PENDING],
	pay: [OrderStatus.ACCEPTED],
	deliver: [OrderStatus.PAID],
	complete: [OrderStatus.DELIVERED],
	cancelByBuyer: [OrderStatus.PENDING, OrderStatus.ACCEPTED],
	cancelBySeller: [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PAID],
	requestReturn: [OrderStatus.COMPLETED],
};

@Injectable()
export class OrderService {
	private readonly logger = new Logger(OrderService.name);

	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('Car') private readonly carModel: Model<T>,
		private readonly couponService: CouponService,
		private readonly telegramNotify: TelegramNotifyService,
		private readonly mailNotify: MailNotifyService,
		private readonly notificationService: NotificationService,
		private readonly socketGateway: SocketGateway,
	) {}

	public get depositRate(): number {
		const rate = Number(process.env.ORDER_DEPOSIT_RATE);
		return rate > 0 && rate <= 1 ? rate : 0.05;
	}

	private effectivePrice(car: T): number {
		const now = Date.now();
		const started = !car.carSaleStartsAt || new Date(car.carSaleStartsAt).getTime() <= now;
		const open = car.carSaleExpiresAt && new Date(car.carSaleExpiresAt).getTime() > now;
		if (car.carIsOnSale && car.carSalePrice && started && open) return car.carSalePrice;
		return car.carPrice;
	}

	private async loadPurchasableCar(carId: ObjectId, buyerId: ObjectId): Promise<T> {
		const car = await this.carModel.findOne({ _id: carId, carStatus: CarStatus.ACTIVE }).lean().exec();
		if (!car) throw new BadRequestException(Message.NO_DATA_FOUND);
		if (String(car.memberId) === String(buyerId)) throw new BadRequestException(Message.OWN_CAR_ORDER_DENIED);
		if (car.carAvailability && car.carAvailability !== CarAvailability.AVAILABLE) {
			throw new BadRequestException(Message.CAR_NOT_AVAILABLE);
		}
		return car;
	}

	// Server-side price preview for the checkout page.
	public async getOrderQuote(buyerId: ObjectId, carId: ObjectId, couponCode?: string): Promise<OrderQuote> {
		const car = await this.loadPurchasableCar(carId, buyerId);
		const carPrice = this.effectivePrice(car);
		let discountAmount = 0;
		let appliedCode: string | undefined;
		let couponMessage: string | undefined;
		if (couponCode) {
			const check = await this.couponService.validateCoupon(couponCode, carPrice);
			couponMessage = check.message;
			if (check.valid) {
				discountAmount = check.discountAmount;
				appliedCode = check.couponCode;
			}
		}
		const orderTotal = Math.max(0, carPrice - discountAmount);
		return {
			carPrice,
			discountAmount,
			orderTotal,
			orderDeposit: Math.round(orderTotal * this.depositRate),
			depositRate: this.depositRate,
			couponCode: appliedCode,
			couponMessage,
		};
	}

	public async createOrder(buyerId: ObjectId, input: OrderInput): Promise<Order> {
		const car = await this.loadPurchasableCar(input.carId, buyerId);
		if (input.deliveryMethod === DeliveryMethod.DELIVERY && !input.deliveryInfo.address) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}

		const open = await this.orderModel
			.findOne({ memberId: buyerId, carId: car._id, orderStatus: { $in: OPEN_STATUSES } })
			.exec();
		if (open) throw new BadRequestException(Message.ORDER_ALREADY_OPEN);

		const carPrice = this.effectivePrice(car);
		let orderDiscount = 0;
		let orderCouponCode: string | undefined;
		if (input.couponCode) {
			const redeemed = await this.couponService.redeemCoupon(input.couponCode, carPrice);
			orderDiscount = redeemed.discountAmount;
			orderCouponCode = redeemed.couponCode;
		}
		const orderTotal = Math.max(0, carPrice - orderDiscount);
		const orderDeposit = Math.round(orderTotal * this.depositRate);
		const orderId = `SLV-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 36)
			.toString(36)
			.toUpperCase()}`;

		let order: Order;
		try {
			order = await this.orderModel.create({
				orderId,
				memberId: buyerId,
				sellerId: car.memberId,
				carId: car._id,
				carSnapshot: {
					carTitle: car.carTitle,
					carImage: car.carImages?.[0],
					carPrice,
					carBrand: car.carBrand,
					carModel: car.carModel,
					manufacturedAt: car.manufacturedAt,
					carMileage: car.carMileage,
				},
				orderStatus: OrderStatus.PENDING,
				deliveryMethod: input.deliveryMethod,
				deliveryInfo: input.deliveryInfo,
				orderTotal,
				orderDeposit,
				orderDiscount,
				orderCouponCode,
			});
		} catch (err: any) {
			if (orderCouponCode) await this.couponService.releaseCoupon(orderCouponCode);
			this.logger.error(`createOrder: ${err.message}`);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		this.afterStatusChange(order, OrderStatus.PENDING, buyerId);
		this.telegramNotify.notifyAdminNewOrder(orderId, car.carTitle, orderTotal);
		this.scheduleDemoProgression(order._id);
		return order;
	}

	// Portfolio demo: orders advance on their own so the whole lifecycle can be
	// seen without a real seller. Each step only fires from the expected status,
	// so a manual decline/cancel is never overridden. Disabled with DEMO_ORDER_FLOW=false.
	private scheduleDemoProgression(orderId: ObjectId): void {
		if ((process.env.DEMO_ORDER_FLOW ?? 'true').toLowerCase() === 'false') return;
		const advance = (from: OrderStatus, to: OrderStatus, patch: T, delayMs: number) => {
			const timer = setTimeout(async () => {
				try {
					const doc = await this.orderModel
						.findOneAndUpdate({ _id: orderId, orderStatus: from }, { orderStatus: to, ...patch }, { new: true })
						.exec();
					if (!doc) return;
					if (to === OrderStatus.ACCEPTED) await this.setCarAvailability(doc.carId, CarAvailability.RESERVED);
					this.afterStatusChange(doc, to, doc.sellerId);
				} catch (err: any) {
					this.logger.warn(`demo progression failed: ${err?.message}`);
				}
			}, delayMs);
			timer.unref();
		};
		advance(OrderStatus.PENDING, OrderStatus.ACCEPTED, { acceptedAt: new Date() }, 20_000);
		advance(OrderStatus.PAID, OrderStatus.DELIVERED, { deliveredAt: new Date() }, 60_000);
	}

	private async setCarAvailability(carId: ObjectId, availability: CarAvailability): Promise<void> {
		await this.carModel.findByIdAndUpdate(carId, { carAvailability: availability }).exec();
	}

	// Notifications to the counter-party + external channels, never blocking the mutation.
	private afterStatusChange(order: Order, status: OrderStatus, actorId: ObjectId | T): void {
		const buyerIsActor = String(actorId) === String(order.memberId);
		const receiverId = buyerIsActor ? order.sellerId : order.memberId;
		const title = `Order ${order.orderId}`;
		const desc = `${order.carSnapshot?.carTitle} — ${status.toLowerCase().replace('_', ' ')}`;
		this.notificationService
			.createNotification({
				notificationType: NotificationType.ORDER,
				notificationGroup: NotificationGroup.ORDER,
				notificationTitle: title,
				notificationDesc: desc,
				authorId: String(actorId),
				receiverId: String(receiverId),
				carId: String(order.carId),
				orderId: String(order._id),
			})
			.catch((err) => this.logger.warn(`order notification failed: ${err?.message}`));
		for (const id of [order.memberId, order.sellerId]) {
			this.socketGateway.emitToMember(String(id), 'order', { orderId: String(order._id), status });
		}
		// Buyer-facing external channels: only the buyer gets Telegram/e-mail updates.
		this.telegramNotify.notifyMember(
			order.memberId,
			order.orderId,
			status,
			order.carSnapshot?.carTitle,
			order.orderTotal,
		);
		this.mailNotify.notifyMember(order.memberId, order.orderId, status, order.carSnapshot?.carTitle, order.orderTotal);
	}

	private async loadForActor(orderId: ObjectId, actor: Actor): Promise<Order> {
		const order = await this.orderModel.findById(orderId).exec();
		if (!order) throw new BadRequestException(Message.NO_DATA_FOUND);
		const isBuyer = String(order.memberId) === String(actor._id);
		const isSeller = String(order.sellerId) === String(actor._id);
		if (!isBuyer && !isSeller && actor.memberType !== MemberType.ADMIN) {
			throw new ForbiddenException(Message.ORDER_NOT_PARTICIPANT);
		}
		return order;
	}

	private assertTransition(order: Order, action: keyof typeof TRANSITIONS): void {
		if (!TRANSITIONS[action].includes(order.orderStatus)) {
			throw new BadRequestException(Message.ORDER_INVALID_TRANSITION);
		}
	}

	private isSeller(order: Order, actor: Actor): boolean {
		return String(order.sellerId) === String(actor._id) || actor.memberType === MemberType.ADMIN;
	}

	private isBuyer(order: Order, actor: Actor): boolean {
		return String(order.memberId) === String(actor._id) || actor.memberType === MemberType.ADMIN;
	}

	private async transition(order: Order, status: OrderStatus, patch: T, actor: Actor): Promise<Order> {
		const updated = (await this.orderModel
			.findByIdAndUpdate(order._id, { orderStatus: status, ...patch }, { new: true })
			.exec()) as unknown as Order;
		this.afterStatusChange(updated, status, actor._id);
		return updated;
	}

	public async respondOrder(actor: Actor, orderId: ObjectId, accept: boolean, reason?: string): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		if (!this.isSeller(order, actor)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		this.assertTransition(order, accept ? 'accept' : 'decline');
		if (accept) {
			await this.setCarAvailability(order.carId, CarAvailability.RESERVED);
			return this.transition(order, OrderStatus.ACCEPTED, { acceptedAt: new Date() }, actor);
		}
		return this.transition(order, OrderStatus.CANCELLED, { cancelledAt: new Date(), cancelReason: reason }, actor);
	}

	// Mock payment: no PSP is wired; the deposit is recorded as paid.
	public async payOrderDeposit(actor: Actor, orderId: ObjectId): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		if (!this.isBuyer(order, actor)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		this.assertTransition(order, 'pay');
		return this.transition(order, OrderStatus.PAID, { paidAt: new Date() }, actor);
	}

	public async markOrderDelivered(actor: Actor, orderId: ObjectId): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		if (!this.isSeller(order, actor)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		this.assertTransition(order, 'deliver');
		return this.transition(order, OrderStatus.DELIVERED, { deliveredAt: new Date() }, actor);
	}

	// Buyer confirms receipt: the deal is done and the car leaves the catalog.
	// keepListing (admin/seed only) keeps the listing ACTIVE for dealers who relist
	// identical stock, while still counting the sale.
	public async confirmOrder(actor: Actor, orderId: ObjectId, keepListing = false): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		if (!this.isBuyer(order, actor)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		this.assertTransition(order, 'complete');
		const completed = await this.transition(order, OrderStatus.COMPLETED, { completedAt: new Date() }, actor);

		const carPatch: T = { $inc: { carSoldCount: 1 } };
		if (keepListing && actor.memberType === MemberType.ADMIN) {
			carPatch.carAvailability = CarAvailability.AVAILABLE;
		} else {
			carPatch.carAvailability = CarAvailability.SOLD;
			carPatch.carStatus = CarStatus.SOLD;
			carPatch.soldAt = new Date();
		}
		await this.carModel.findByIdAndUpdate(order.carId, carPatch).exec();
		return completed;
	}

	public async cancelOrder(actor: Actor, orderId: ObjectId, reason?: string): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		const sellerSide = this.isSeller(order, actor) && String(order.memberId) !== String(actor._id);
		this.assertTransition(order, sellerSide ? 'cancelBySeller' : 'cancelByBuyer');
		if (order.orderStatus !== OrderStatus.PENDING)
			await this.setCarAvailability(order.carId, CarAvailability.AVAILABLE);
		return this.transition(order, OrderStatus.CANCELLED, { cancelledAt: new Date(), cancelReason: reason }, actor);
	}

	public async requestReturn(actor: Actor, orderId: ObjectId, reason?: string): Promise<Order> {
		const order = await this.loadForActor(orderId, actor);
		if (!this.isBuyer(order, actor)) throw new ForbiddenException(Message.NOT_ALLOWED_REQUEST);
		this.assertTransition(order, 'requestReturn');
		const completedAt = order.completedAt ? new Date(order.completedAt).getTime() : 0;
		if (Date.now() - completedAt > RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
			throw new BadRequestException(Message.RETURN_WINDOW_CLOSED);
		}
		return this.transition(
			order,
			OrderStatus.RETURN_REQUESTED,
			{ returnRequestedAt: new Date(), returnReason: reason },
			actor,
		);
	}

	private buildList(match: T, input: OrdersInquiry) {
		const { page, limit, sort, direction } = input;
		const sortBy: T = { [sort ?? 'createdAt']: direction ?? Direction.DESC };
		return this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sortBy },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							{ $lookup: { from: 'members', localField: 'sellerId', foreignField: '_id', as: 'sellerData' } },
							{ $unwind: { path: '$sellerData', preserveNullAndEmptyArrays: true } },
							{
								$lookup: {
									from: 'reviews',
									let: { orderId: '$_id' },
									pipeline: [{ $match: { $expr: { $eq: ['$orderId', '$$orderId'] } } }, { $limit: 1 }],
									as: 'reviewDocs',
								},
							},
							{ $addFields: { reviewed: { $gt: [{ $size: '$reviewDocs' }, 0] } } },
							{ $project: { reviewDocs: 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
	}

	private applySearch(match: T, input: OrdersInquiry): void {
		const search = input.search;
		if (!search) return;
		if (search.orderStatus) match.orderStatus = search.orderStatus;
		if (search.statusList?.length) match.orderStatus = { $in: search.statusList };
		if (search.carId) match.carId = shapeIntoMongoObjectId(search.carId);
	}

	public async getMyOrders(memberId: ObjectId, input: OrdersInquiry): Promise<Orders> {
		const match: T = { memberId };
		this.applySearch(match, input);
		const result = await this.buildList(match, input);
		return result[0] as Orders;
	}

	public async getSellerOrders(sellerId: ObjectId, input: OrdersInquiry): Promise<Orders> {
		const match: T = { sellerId };
		this.applySearch(match, input);
		const result = await this.buildList(match, input);
		return result[0] as Orders;
	}

	public async getOrderById(actor: Actor, orderId: ObjectId): Promise<Order> {
		await this.loadForActor(orderId, actor);
		const result = await this.buildList({ _id: orderId }, { page: 1, limit: 1 });
		const order = result[0]?.list?.[0];
		if (!order) throw new BadRequestException(Message.NO_DATA_FOUND);
		return order as Order;
	}

	// Lightweight probe for the navbar "active order" pill.
	public async getMyActiveOrder(memberId: ObjectId): Promise<Order | null> {
		return (await this.orderModel
			.findOne({ memberId, orderStatus: { $in: OPEN_STATUSES } })
			.sort({ createdAt: -1 })
			.lean()
			.exec()) as unknown as Order | null;
	}

	/** ADMIN **/
	public async getAllOrdersByAdmin(input: OrdersInquiry): Promise<Orders> {
		const match: T = {};
		this.applySearch(match, input);
		const result = await this.buildList(match, input);
		return result[0] as Orders;
	}

	public async updateOrderStatusByAdmin(actor: Actor, input: OrderUpdate): Promise<Order> {
		const order = await this.orderModel.findById(input._id).exec();
		if (!order || !input.orderStatus) throw new BadRequestException(Message.NO_DATA_FOUND);
		const patch: T = {};
		switch (input.orderStatus) {
			case OrderStatus.ACCEPTED:
				patch.acceptedAt = new Date();
				await this.setCarAvailability(order.carId, CarAvailability.RESERVED);
				break;
			case OrderStatus.PAID:
				patch.paidAt = new Date();
				break;
			case OrderStatus.DELIVERED:
				patch.deliveredAt = new Date();
				break;
			case OrderStatus.COMPLETED:
				patch.completedAt = new Date();
				await this.carModel
					.findByIdAndUpdate(order.carId, { $inc: { carSoldCount: 1 }, carAvailability: CarAvailability.AVAILABLE })
					.exec();
				break;
			case OrderStatus.CANCELLED:
				patch.cancelledAt = new Date();
				patch.cancelReason = input.reason;
				await this.setCarAvailability(order.carId, CarAvailability.AVAILABLE);
				break;
			case OrderStatus.RETURNED:
				patch.returnedAt = new Date();
				await this.carModel
					.findByIdAndUpdate(order.carId, {
						carAvailability: CarAvailability.AVAILABLE,
						carStatus: CarStatus.ACTIVE,
						$unset: { soldAt: 1 },
					})
					.exec();
				break;
			default:
				break;
		}
		return this.transition(order, input.orderStatus, patch, actor);
	}
}
