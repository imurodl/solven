import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import {
	CarAvailability,
	CarColor,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarOptions,
	CarStatus,
	CarTransmission,
	CarType,
} from '../../enums/car.enum';

@InputType()
export class CarUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => CarType, { nullable: true })
	carType?: CarType;

	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;

	@IsOptional()
	@Field(() => CarLocation, { nullable: true })
	carLocation?: CarLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carAddress?: string;

	@IsOptional()
	@Field(() => CarFuelType, { nullable: true })
	carFuelType?: CarFuelType;

	@IsOptional()
	@Field(() => CarColor, { nullable: true })
	carColor?: CarColor;

	@IsOptional()
	@Field(() => CarTransmission, { nullable: true })
	carTransmission?: CarTransmission;

	@IsOptional()
	@Field(() => [CarOptions], { nullable: true })
	carOptions?: CarOptions[];

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carTitle?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	carPrice?: number;

	@IsOptional()
	@Min(100)
	@Field(() => Number, { nullable: true })
	carMileage?: number;

	@IsOptional()
	@Min(1)
	@Max(20)
	@Field(() => Int, { nullable: true })
	carSeats?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carImages?: string[];

	@IsOptional()
	@Length(5, 3000)
	@Field(() => String, { nullable: true })
	carDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carRent?: boolean;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	carSalePrice?: number;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carIsOnSale?: boolean;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	carSaleStartsAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	carSaleExpiresAt?: Date;

	@IsOptional()
	@Field(() => CarAvailability, { nullable: true })
	carAvailability?: CarAvailability;

	@IsOptional()
	@Field(() => CarCondition, { nullable: true })
	carCondition?: CarCondition;

	@IsOptional()
	@Length(11, 17)
	@Field(() => String, { nullable: true })
	carVin?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carImageCredits?: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	car3dModel?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carBrand?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carModel?: string;

	soldAt?: Date;

	deletedAt?: Date;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	manufacturedAt?: number;
}
