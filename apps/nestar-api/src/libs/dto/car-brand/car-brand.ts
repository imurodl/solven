import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsNotEmpty, Length, ArrayNotEmpty, IsArray } from 'class-validator';
import { ObjectId } from 'mongoose';

@InputType()
export class CarBrandInput {
	@IsNotEmpty()
	@Length(2, 50)
	@Field(() => String)
	carBrandName: string;

	@IsArray()
	@ArrayNotEmpty()
	@Field(() => [String])
	carBrandModels: string[];
}

@InputType()
export class CarBrandUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	carBrandName?: string;

	@IsOptional()
	@IsArray()
	@Field(() => [String], { nullable: true })
	carBrandModels?: string[];
}

@ObjectType()
export class CarBrand {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	carBrandName: string;

	@Field(() => [String])
	carBrandModels: string[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}
