import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CarLocation } from '../../enums/car.enum';
import { ServiceJobStatus, ServiceType } from '../../enums/service-job.enum';
import { Direction } from '../../enums/common.enum';

export const availableServiceSorts = [
	'createdAt',
	'updatedAt',
	'serviceLikes',
	'serviceViews',
	'servicePrice',
	'serviceRank',
];

@InputType()
export class ServiceJobInput {
	@IsNotEmpty()
	@Field(() => ServiceType)
	serviceType: ServiceType;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	serviceTitle: string;

	@IsOptional()
	@Length(5, 3000)
	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@IsNotEmpty()
	@Length(1, 30)
	@Field(() => String)
	carBrand: string;

	@IsNotEmpty()
	@Length(1, 40)
	@Field(() => String)
	carModel: string;

	@IsOptional()
	@IsInt()
	@Min(1980)
	@Field(() => Int, { nullable: true })
	manufacturedAt?: number;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	servicePrice: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(720)
	@Field(() => Int, { nullable: true })
	serviceDuration?: number;

	@IsNotEmpty()
	@ArrayMaxSize(10)
	@Field(() => [String])
	serviceImages: string[];

	@IsNotEmpty()
	@Field(() => CarLocation)
	serviceLocation: CarLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	serviceAddress: string;

	memberId?: ObjectId;
}

@InputType()
export class ServiceJobUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ServiceType, { nullable: true })
	serviceType?: ServiceType;

	@IsOptional()
	@Field(() => ServiceJobStatus, { nullable: true })
	serviceStatus?: ServiceJobStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	serviceTitle?: string;

	@IsOptional()
	@Length(5, 3000)
	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carBrand?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carModel?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	manufacturedAt?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	servicePrice?: number;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	serviceDuration?: number;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	serviceImages?: string[];

	@IsOptional()
	@Field(() => CarLocation, { nullable: true })
	serviceLocation?: CarLocation;

	@IsOptional()
	@Field(() => String, { nullable: true })
	serviceAddress?: string;

	deletedAt?: Date;
}

@InputType()
class SJISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [ServiceType], { nullable: true })
	typeList?: ServiceType[];

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	locationList?: CarLocation[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	brandList?: string[];

	@IsOptional()
	@Field(() => Int, { nullable: true })
	maxPrice?: number;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ServiceJobsInquiry {
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
	@IsIn(availableServiceSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => SJISearch)
	search: SJISearch;
}

@InputType()
class ASJISearch {
	@IsOptional()
	@Field(() => ServiceJobStatus, { nullable: true })
	serviceStatus?: ServiceJobStatus;
}

@InputType()
export class AllServiceJobsInquiry {
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
	@IsIn(availableServiceSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ASJISearch)
	search: ASJISearch;
}
