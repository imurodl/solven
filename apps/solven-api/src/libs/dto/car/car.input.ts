import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
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
import { ObjectId } from 'mongoose';
import { availableCarOptions, availableCarSorts, availableOptions } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class CarInput {
	@IsNotEmpty()
	@Field(() => CarType)
	carType: CarType;

	@IsNotEmpty()
	@Length(1, 20)
	@Field(() => String)
	carBrand: string;

	@IsNotEmpty()
	@Length(1, 20)
	@Field(() => String)
	carModel: string;

	@IsNotEmpty()
	@Field(() => CarLocation)
	carLocation: CarLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carAddress: string;

	@IsNotEmpty()
	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@IsNotEmpty()
	@Field(() => CarTransmission)
	carTransmission: CarTransmission;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	carPrice: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	carSeats: number;

	@IsOptional()
	@IsIn(availableCarOptions, { each: true })
	@Field(() => [String], { nullable: true })
	carOptions?: string[];

	@IsNotEmpty()
	@Field(() => CarColor)
	carColor: CarColor;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	carMileage: number;

	@IsNotEmpty()
	@Field(() => [String])
	carImages: string[];

	@IsNotEmpty()
	@IsInt()
	@Min(1900)
	@Field(() => Int)
	manufacturedAt: number;

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

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class MileageRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class YearRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
class CarsISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	locationList?: CarLocation[];

	@IsOptional()
	@Field(() => [CarType], { nullable: true })
	typeList?: CarType[];

	@IsOptional()
	@Field(() => [CarFuelType], { nullable: true })
	fuelTypeList?: CarFuelType[];

	@IsOptional()
	@Field(() => [CarTransmission], { nullable: true })
	transmissionList?: CarTransmission[];

	@IsOptional()
	@Field(() => [CarColor], { nullable: true })
	colorList?: CarColor[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	brandList?: string[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	modelList?: string[];

	@IsOptional()
	@IsIn(availableCarOptions, { each: true })
	@Field(() => [CarOptions], { nullable: true })
	carListingOptions?: CarOptions[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	carOptions?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => MileageRange, { nullable: true })
	mileageRange?: MileageRange;

	@IsOptional()
	@Field(() => YearRange, { nullable: true })
	yearRange?: YearRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carIsOnSale?: boolean;

	@IsOptional()
	@Field(() => [CarCondition], { nullable: true })
	conditionList?: CarCondition[];

	@IsOptional()
	@Field(() => [CarAvailability], { nullable: true })
	availabilityList?: CarAvailability[];
}

@InputType()
export class CarsInquiry {
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
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CarsISearch)
	search: CarsISearch;
}

@InputType()
class ACISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;
}

@InputType()
export class AgentCarsInquiry {
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
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ACISearch)
	search: ACISearch;
}

@InputType()
class ALCISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	carLocationList?: CarLocation[];
}

@InputType()
export class AllCarsInquiry {
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
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALCISearch)
	search: ALCISearch;
}

@InputType()
export class OrdinaryInquiry {
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
}
