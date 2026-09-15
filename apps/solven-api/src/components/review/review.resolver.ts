import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Throttle } from '@nestjs/throttler';
import { ReviewService } from './review.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Review, ReviewReactionResult, Reviews, ReviewSummary } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry, ReviewUpdate } from '../../libs/dto/review/review.input';
import { ReviewReaction } from '../../libs/enums/review.enum';

@Resolver()
export class ReviewResolver {
	private readonly logger = new Logger(ReviewResolver.name);

	constructor(private readonly reviewService: ReviewService) {}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => Review)
	public async createReview(@Args('input') input: ReviewInput, @AuthMember('_id') memberId: ObjectId): Promise<Review> {
		this.logger.log('Mutation: createReview');
		input.carId = shapeIntoMongoObjectId(input.carId);
		input.orderId = shapeIntoMongoObjectId(input.orderId);
		return await this.reviewService.createReview(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Reviews)
	public async getReviews(
		@Args('input') input: ReviewsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Reviews> {
		this.logger.log('Query: getReviews');
		return await this.reviewService.getReviews(input, memberId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => ReviewSummary)
	public async getCarReviewSummary(@Args('carId') carId: string): Promise<ReviewSummary> {
		this.logger.log('Query: getCarReviewSummary');
		return await this.reviewService.getReviewSummary({ carId: shapeIntoMongoObjectId(carId) });
	}

	@UseGuards(WithoutGuard)
	@Query(() => ReviewSummary)
	public async getSellerReviewSummary(@Args('sellerId') sellerId: string): Promise<ReviewSummary> {
		this.logger.log('Query: getSellerReviewSummary');
		return await this.reviewService.getReviewSummary({ sellerId: shapeIntoMongoObjectId(sellerId) });
	}

	@Throttle({ default: { limit: 60, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => ReviewReactionResult)
	public async toggleReviewReaction(
		@Args('reviewId') reviewId: string,
		@Args('reaction', { type: () => ReviewReaction }) reaction: ReviewReaction,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ReviewReactionResult> {
		this.logger.log('Mutation: toggleReviewReaction');
		return await this.reviewService.toggleReviewReaction(memberId, shapeIntoMongoObjectId(reviewId), reaction);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Review)
	public async updateReview(
		@Args('input') input: ReviewUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Review> {
		this.logger.log('Mutation: updateReview');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.reviewService.updateReview(memberId, input);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Reviews)
	public async getAllReviewsByAdmin(@Args('input') input: ReviewsInquiry): Promise<Reviews> {
		this.logger.log('Query: getAllReviewsByAdmin');
		return await this.reviewService.getAllReviewsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Review)
	public async removeReviewByAdmin(@Args('reviewId') reviewId: string): Promise<Review> {
		this.logger.log('Mutation: removeReviewByAdmin');
		return await this.reviewService.removeReviewByAdmin(shapeIntoMongoObjectId(reviewId));
	}
}
