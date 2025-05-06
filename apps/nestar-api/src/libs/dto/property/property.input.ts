import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { CarLocation, CarStatus, CarType } from '../../enums/car.enum';
import { ObjectId } from 'mongoose';
import { availableOptions, availablePropertySorts } from '../../config';
import { Direction } from '../../enums/common.enum';

@InputType()
export class PropertyInput {
	@IsNotEmpty()
	@Field(() => CarType)
	propertyType: CarType;

	@IsNotEmpty()
	@Field(() => CarLocation)
	propertyLocation: CarLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	propertyAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	propertyTitle: string;

	@IsNotEmpty()
	@Field(() => Number)
	propertyPrice: number;

	@IsNotEmpty()
	@Field(() => Number)
	propertySquare: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	propertyBeds: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	propertyRooms: number;

	@IsNotEmpty()
	@Field(() => [String])
	propertyImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carRent?: boolean;

	memberId?: ObjectId;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	constructedAt?: boolean;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class SquaresRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
class PISearch {
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
	@Field(() => [Int], { nullable: true })
	roomsList?: Number[];

	@IsOptional()
	@Field(() => [Int], { nullable: true })
	bedsList?: Number[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	options?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => SquaresRange, { nullable: true })
	squaresRange?: SquaresRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class PropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	propertyStatus?: CarStatus;
}

@InputType()
export class AgentPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	propertyStatus?: CarStatus;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	propertyLocationList?: CarLocation[];
}

@InputType()
export class AllPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
