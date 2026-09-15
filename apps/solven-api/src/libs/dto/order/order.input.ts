import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { DeliveryMethod, OrderStatus } from '../../enums/order.enum';

@InputType()
export class DeliveryInfoInput {
	@IsNotEmpty()
	@Length(2, 60)
	@Field(() => String)
	fullName: string;

	@IsNotEmpty()
	@Length(7, 20)
	@Field(() => String)
	phone: string;

	@IsOptional()
	@Length(3, 200)
	@Field(() => String, { nullable: true })
	address?: string;

	@IsOptional()
	@Length(2, 60)
	@Field(() => String, { nullable: true })
	city?: string;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	note?: string;
}

@InputType()
export class OrderInput {
	@IsNotEmpty()
	@Field(() => String)
	carId: ObjectId;

	@IsNotEmpty()
	@Field(() => DeliveryMethod)
	deliveryMethod: DeliveryMethod;

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => DeliveryInfoInput)
	@Field(() => DeliveryInfoInput)
	deliveryInfo: DeliveryInfoInput;

	@IsOptional()
	@Length(3, 24)
	@Field(() => String, { nullable: true })
	couponCode?: string;
}

@InputType()
export class OrderUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	reason?: string;
}

@InputType()
class OISearch {
	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@Field(() => [OrderStatus], { nullable: true })
	statusList?: OrderStatus[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	carId?: ObjectId;
}

@InputType()
export class OrdersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Max(1000)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(['createdAt', 'updatedAt', 'orderTotal'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => OISearch, { nullable: true })
	search?: OISearch;
}
