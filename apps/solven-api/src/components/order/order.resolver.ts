import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Throttle } from '@nestjs/throttler';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Member } from '../../libs/dto/member/member';
import { Order, OrderQuote, Orders } from '../../libs/dto/order/order';
import { OrderInput, OrdersInquiry, OrderUpdate } from '../../libs/dto/order/order.input';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class OrderResolver {
	private readonly logger = new Logger(OrderResolver.name);

	constructor(private readonly orderService: OrderService) {}

	@UseGuards(AuthGuard)
	@Query(() => OrderQuote)
	public async getOrderQuote(
		@Args('carId') carId: string,
		@Args('couponCode', { type: () => String, nullable: true }) couponCode: string | undefined,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<OrderQuote> {
		this.logger.log('Query: getOrderQuote');
		return await this.orderService.getOrderQuote(memberId, shapeIntoMongoObjectId(carId), couponCode || undefined);
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async createOrder(@Args('input') input: OrderInput, @AuthMember('_id') memberId: ObjectId): Promise<Order> {
		this.logger.log('Mutation: createOrder');
		input.carId = shapeIntoMongoObjectId(input.carId);
		return await this.orderService.createOrder(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async respondOrder(
		@Args('orderId') orderId: string,
		@Args('accept') accept: boolean,
		@Args('reason', { type: () => String, nullable: true }) reason: string | undefined,
		@AuthMember() actor: Member,
	): Promise<Order> {
		this.logger.log('Mutation: respondOrder');
		return await this.orderService.respondOrder(actor, shapeIntoMongoObjectId(orderId), accept, reason);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async payOrderDeposit(@Args('orderId') orderId: string, @AuthMember() actor: Member): Promise<Order> {
		this.logger.log('Mutation: payOrderDeposit');
		return await this.orderService.payOrderDeposit(actor, shapeIntoMongoObjectId(orderId));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async markOrderDelivered(@Args('orderId') orderId: string, @AuthMember() actor: Member): Promise<Order> {
		this.logger.log('Mutation: markOrderDelivered');
		return await this.orderService.markOrderDelivered(actor, shapeIntoMongoObjectId(orderId));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async confirmOrder(
		@Args('orderId') orderId: string,
		@Args('keepListing', { type: () => Boolean, nullable: true }) keepListing: boolean | undefined,
		@AuthMember() actor: Member,
	): Promise<Order> {
		this.logger.log('Mutation: confirmOrder');
		return await this.orderService.confirmOrder(actor, shapeIntoMongoObjectId(orderId), !!keepListing);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async cancelOrder(
		@Args('orderId') orderId: string,
		@Args('reason', { type: () => String, nullable: true }) reason: string | undefined,
		@AuthMember() actor: Member,
	): Promise<Order> {
		this.logger.log('Mutation: cancelOrder');
		return await this.orderService.cancelOrder(actor, shapeIntoMongoObjectId(orderId), reason);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async requestReturn(
		@Args('orderId') orderId: string,
		@Args('reason', { type: () => String, nullable: true }) reason: string | undefined,
		@AuthMember() actor: Member,
	): Promise<Order> {
		this.logger.log('Mutation: requestReturn');
		return await this.orderService.requestReturn(actor, shapeIntoMongoObjectId(orderId), reason);
	}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getMyOrders(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Orders> {
		this.logger.log('Query: getMyOrders');
		return await this.orderService.getMyOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getSellerOrders(
		@Args('input') input: OrdersInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Orders> {
		this.logger.log('Query: getSellerOrders');
		return await this.orderService.getSellerOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Order)
	public async getOrderById(@Args('orderId') orderId: string, @AuthMember() actor: Member): Promise<Order> {
		this.logger.log('Query: getOrderById');
		return await this.orderService.getOrderById(actor, shapeIntoMongoObjectId(orderId));
	}

	@UseGuards(AuthGuard)
	@Query(() => Order, { nullable: true })
	public async getMyActiveOrder(@AuthMember('_id') memberId: ObjectId): Promise<Order | null> {
		this.logger.log('Query: getMyActiveOrder');
		return await this.orderService.getMyActiveOrder(memberId);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Orders)
	public async getAllOrdersByAdmin(@Args('input') input: OrdersInquiry): Promise<Orders> {
		this.logger.log('Query: getAllOrdersByAdmin');
		return await this.orderService.getAllOrdersByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Order)
	public async updateOrderStatusByAdmin(
		@Args('input') input: OrderUpdate,
		@AuthMember() actor: Member,
	): Promise<Order> {
		this.logger.log('Mutation: updateOrderStatusByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.orderService.updateOrderStatusByAdmin(actor, input);
	}
}
