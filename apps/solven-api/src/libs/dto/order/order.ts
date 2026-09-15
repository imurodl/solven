import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { DeliveryMethod, OrderStatus } from '../../enums/order.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class CarSnapshot {
	@Field(() => String)
	carTitle: string;

	@Field(() => String, { nullable: true })
	carImage?: string;

	@Field(() => Float)
	carPrice: number;

	@Field(() => String, { nullable: true })
	carBrand?: string;

	@Field(() => String, { nullable: true })
	carModel?: string;

	@Field(() => Int, { nullable: true })
	manufacturedAt?: number;

	@Field(() => Int, { nullable: true })
	carMileage?: number;
}

@ObjectType()
export class DeliveryInfo {
	@Field(() => String)
	fullName: string;

	@Field(() => String)
	phone: string;

	@Field(() => String, { nullable: true })
	address?: string;

	@Field(() => String, { nullable: true })
	city?: string;

	@Field(() => String, { nullable: true })
	note?: string;
}

@ObjectType()
export class Order {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	orderId: string;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	sellerId: ObjectId;

	@Field(() => String)
	carId: ObjectId;

	@Field(() => CarSnapshot)
	carSnapshot: CarSnapshot;

	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	@Field(() => DeliveryMethod)
	deliveryMethod: DeliveryMethod;

	@Field(() => DeliveryInfo)
	deliveryInfo: DeliveryInfo;

	@Field(() => Float)
	orderTotal: number;

	@Field(() => Float)
	orderDeposit: number;

	@Field(() => Float)
	orderDiscount: number;

	@Field(() => String, { nullable: true })
	orderCouponCode?: string;

	@Field(() => Date, { nullable: true })
	acceptedAt?: Date;

	@Field(() => Date, { nullable: true })
	paidAt?: Date;

	@Field(() => Date, { nullable: true })
	deliveredAt?: Date;

	@Field(() => Date, { nullable: true })
	completedAt?: Date;

	@Field(() => Date, { nullable: true })
	cancelledAt?: Date;

	@Field(() => String, { nullable: true })
	cancelReason?: string;

	@Field(() => Date, { nullable: true })
	returnRequestedAt?: Date;

	@Field(() => String, { nullable: true })
	returnReason?: string;

	@Field(() => Date, { nullable: true })
	returnedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Member, { nullable: true })
	sellerData?: Member;

	@Field(() => Boolean, { nullable: true })
	reviewed?: boolean;
}

@ObjectType()
export class Orders {
	@Field(() => [Order])
	list: Order[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}

// Server-computed totals shown on checkout before the order exists.
@ObjectType()
export class OrderQuote {
	@Field(() => Float)
	carPrice: number;

	@Field(() => Float)
	discountAmount: number;

	@Field(() => Float)
	orderTotal: number;

	@Field(() => Float)
	orderDeposit: number;

	@Field(() => Float)
	depositRate: number;

	@Field(() => String, { nullable: true })
	couponCode?: string;

	@Field(() => String, { nullable: true })
	couponMessage?: string;
}
