import { Field, InputType, Int } from '@nestjs/graphql';
import { ArrayMaxSize, IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';

@InputType()
export class ReviewInput {
	@IsNotEmpty()
	@Field(() => String)
	carId: ObjectId;

	@IsNotEmpty()
	@Field(() => String)
	orderId: ObjectId;

	@IsNotEmpty()
	@Min(1)
	@Max(5)
	@Field(() => Int)
	reviewRating: number;

	@IsNotEmpty()
	@Length(3, 1000)
	@Field(() => String)
	reviewContent: string;

	@IsOptional()
	@ArrayMaxSize(5)
	@Field(() => [String], { nullable: true })
	reviewImages?: string[];

	memberId?: ObjectId;
	sellerId?: ObjectId;
}

@InputType()
export class ReviewUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Min(1)
	@Max(5)
	@Field(() => Int, { nullable: true })
	reviewRating?: number;

	@IsOptional()
	@Length(3, 1000)
	@Field(() => String, { nullable: true })
	reviewContent?: string;

	@IsOptional()
	@ArrayMaxSize(5)
	@Field(() => [String], { nullable: true })
	reviewImages?: string[];
}

@InputType()
class RISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	carId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	sellerId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;
}

@InputType()
export class ReviewsInquiry {
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
	@IsIn(['createdAt', 'updatedAt', 'reviewRating'])
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => RISearch)
	search: RISearch;
}
