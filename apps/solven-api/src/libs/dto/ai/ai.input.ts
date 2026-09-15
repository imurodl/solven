import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { CarFuelType, CarTransmission, CarType } from '../../enums/car.enum';

@InputType()
export class CarPhotoAnalysisInput {
	@IsNotEmpty()
	@Length(100, 20_000_000)
	@Field(() => String)
	imageBase64: string;

	@IsOptional()
	@IsIn(['image/jpeg', 'image/png', 'image/webp'])
	@Field(() => String, { nullable: true })
	mimeType?: string;

	@IsOptional()
	@Length(0, 300)
	@Field(() => String, { nullable: true })
	userRequest?: string;
}

@InputType()
export class CarPriceEstimateInput {
	@IsNotEmpty()
	@Length(1, 30)
	@Field(() => String)
	carBrand: string;

	@IsNotEmpty()
	@Length(1, 40)
	@Field(() => String)
	carModel: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1980)
	@Max(2100)
	@Field(() => Int)
	manufacturedAt: number;

	@IsNotEmpty()
	@IsInt()
	@Min(0)
	@Field(() => Int)
	carMileage: number;

	@IsOptional()
	@Field(() => CarFuelType, { nullable: true })
	carFuelType?: CarFuelType;

	@IsOptional()
	@Field(() => CarType, { nullable: true })
	carType?: CarType;

	@IsOptional()
	@Field(() => CarTransmission, { nullable: true })
	carTransmission?: CarTransmission;

	@IsOptional()
	@Min(0)
	@Field(() => Int, { nullable: true })
	askingPrice?: number;
}

@InputType()
export class CarDescriptionInput {
	@IsNotEmpty()
	@Length(1, 30)
	@Field(() => String)
	carBrand: string;

	@IsNotEmpty()
	@Length(1, 40)
	@Field(() => String)
	carModel: string;

	@IsNotEmpty()
	@IsInt()
	@Field(() => Int)
	manufacturedAt: number;

	@IsNotEmpty()
	@IsInt()
	@Field(() => Int)
	carMileage: number;

	@IsOptional()
	@Field(() => CarFuelType, { nullable: true })
	carFuelType?: CarFuelType;

	@IsOptional()
	@Field(() => CarTransmission, { nullable: true })
	carTransmission?: CarTransmission;

	@IsOptional()
	@Field(() => CarType, { nullable: true })
	carType?: CarType;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carOptions?: string[];

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	notes?: string;

	@IsOptional()
	@IsIn(['en', 'kr', 'ru', 'uz'])
	@Field(() => String, { nullable: true })
	locale?: string;
}
