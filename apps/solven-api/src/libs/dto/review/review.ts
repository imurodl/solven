import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ReviewReaction, ReviewStatus } from '../../enums/review.enum';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class RatingCount {
	@Field(() => Int)
	star: number;

	@Field(() => Int)
	count: number;
}

@ObjectType()
export class Review {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => String)
	carId: ObjectId;

	@Field(() => String)
	sellerId: ObjectId;

	@Field(() => String)
	orderId: ObjectId;

	@Field(() => Int)
	reviewRating: number;

	@Field(() => String)
	reviewContent: string;

	@Field(() => [String])
	reviewImages: string[];

	@Field(() => ReviewStatus)
	reviewStatus: ReviewStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => String, { nullable: true })
	carTitle?: string;

	@Field(() => String, { nullable: true })
	carImage?: string;

	@Field(() => Int, { nullable: true })
	likesCount?: number;

	@Field(() => Int, { nullable: true })
	dislikesCount?: number;

	@Field(() => ReviewReaction, { nullable: true })
	myReaction?: ReviewReaction;
}

@ObjectType()
export class ReviewReactionResult {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => Int)
	likesCount: number;

	@Field(() => Int)
	dislikesCount: number;

	@Field(() => ReviewReaction, { nullable: true })
	myReaction?: ReviewReaction;
}

@ObjectType()
export class ReviewSummary {
	@Field(() => Float)
	averageRating: number;

	@Field(() => Int)
	totalReviews: number;

	@Field(() => [RatingCount])
	ratingDistribution: RatingCount[];
}

@ObjectType()
export class Reviews {
	@Field(() => [Review])
	list: Review[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
