import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty, Length, ArrayNotEmpty, IsArray } from 'class-validator';
import { ObjectId } from 'mongoose';
import { CarBrandStatus } from '../../enums/car.enum';

@InputType()
export class CarBrandInput {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	carBrandName: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carBrandImg?: string;

	@IsArray()
	@ArrayNotEmpty()
	@Field(() => [String])
	carBrandModels: string[];
}

@InputType()
export class CarBrandUpdate {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	carBrandName: string;

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	carBrandModel?: string;

	@IsOptional()
	@Field(() => CarBrandStatus, { nullable: true })
	carBrandStatus?: CarBrandStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	carBrandImg?: string;
}

@InputType()
export class CarBrandModelInput {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	carBrandName: string;

	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	carBrandModel: string;
}

@ObjectType()
export class CarBrand {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	carBrandName: string;

	@Field(() => String)
	carBrandImg: string;

	@Field(() => [String])
	carBrandModels: string[];

	@Field(() => CarBrandStatus)
	carBrandStatus: CarBrandStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
