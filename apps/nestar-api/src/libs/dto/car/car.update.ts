import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CarColor, CarFuelType, CarLocation, CarOptions, CarStatus, CarTransmission, CarType } from '../../enums/car.enum';

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
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	carDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carRent?: boolean;

	soldAt?: Date;

	deletedAt?: Date;

	@IsOptional()
	@Field(() => Date, { nullable: true })
	manufacturedAt?: Date;
}
