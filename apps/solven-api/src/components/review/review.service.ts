import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Review, ReviewReactionResult, Reviews, ReviewSummary } from '../../libs/dto/review/review';
import { ReviewInput, ReviewsInquiry, ReviewUpdate } from '../../libs/dto/review/review.input';
import { ReviewReaction, ReviewStatus } from '../../libs/enums/review.enum';
import { OrderStatus } from '../../libs/enums/order.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class ReviewService {
	private readonly logger = new Logger(ReviewService.name);

	constructor(
		@InjectModel('Review') private readonly reviewModel: Model<Review>,
		@InjectModel('Order') private readonly orderModel: Model<T>,
		@InjectModel('Car') private readonly carModel: Model<T>,
		@InjectModel('Member') private readonly memberModel: Model<T>,
		private readonly notificationService: NotificationService,
	) {}

	// Reviews are gated on a COMPLETED deal for that exact car by the same buyer.
	public async createReview(memberId: ObjectId, input: ReviewInput): Promise<Review> {
		const order = await this.orderModel
			.findOne({ _id: input.orderId, memberId, carId: input.carId, orderStatus: OrderStatus.COMPLETED })
			.exec();
		if (!order) throw new BadRequestException(Message.REVIEW_REQUIRES_COMPLETED_ORDER);

		const existing = await this.reviewModel.findOne({ memberId, carId: input.carId, orderId: input.orderId }).exec();
		if (existing) throw new BadRequestException(Message.REVIEW_ALREADY_EXISTS);

		let review: Review;
		try {
			review = await this.reviewModel.create({ ...input, memberId, sellerId: order.sellerId });
		} catch (err: any) {
			this.logger.error(`createReview: ${err.message}`);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.recomputeCarRating(input.carId);
		await this.recomputeSellerRating(order.sellerId);

		const reviewer = await this.memberModel.findById(memberId).lean().exec();
		await this.notificationService
			.createNotification({
				notificationType: NotificationType.REVIEW,
				notificationGroup: NotificationGroup.CAR,
				notificationTitle: 'New review',
				notificationDesc: `${reviewer?.memberNick ?? 'A buyer'} rated "${order.carSnapshot?.carTitle}" ${input.reviewRating}/5`,
				authorId: String(memberId),
				receiverId: String(order.sellerId),
				carId: String(input.carId),
				orderId: String(order._id),
			})
			.catch((err) => this.logger.warn(`review notification failed: ${err?.message}`));

		return review;
	}

	public async getReviews(input: ReviewsInquiry, memberId?: ObjectId): Promise<Reviews> {
		const { page, limit, sort, direction, search } = input;
		const match: T = { reviewStatus: ReviewStatus.ACTIVE };
		if (search.carId) match.carId = shapeIntoMongoObjectId(search.carId);
		if (search.sellerId) match.sellerId = shapeIntoMongoObjectId(search.sellerId);
		if (search.memberId) match.memberId = shapeIntoMongoObjectId(search.memberId);
		const sortBy: T = { [sort ?? 'createdAt']: direction ?? Direction.DESC };
		const me = memberId ? shapeIntoMongoObjectId(memberId) : null;

		const result = await this.reviewModel
			.aggregate([
				{ $match: match },
				{ $sort: sortBy },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							{ $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'car' } },
							{ $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },
							{
								$addFields: {
									carTitle: '$car.carTitle',
									carImage: { $arrayElemAt: ['$car.carImages', 0] },
									likesCount: { $size: { $ifNull: ['$reviewLikes', []] } },
									dislikesCount: { $size: { $ifNull: ['$reviewDislikes', []] } },
									myReaction: {
										$cond: [
											{ $in: [me, { $ifNull: ['$reviewLikes', []] }] },
											ReviewReaction.LIKE,
											{
												$cond: [{ $in: [me, { $ifNull: ['$reviewDislikes', []] }] }, ReviewReaction.DISLIKE, null],
											},
										],
									},
								},
							},
							{ $project: { car: 0, reviewLikes: 0, reviewDislikes: 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return result[0] as Reviews;
	}

	public async toggleReviewReaction(
		memberId: ObjectId,
		reviewId: ObjectId,
		reaction: ReviewReaction,
	): Promise<ReviewReactionResult> {
		const review = await this.reviewModel.findOne({ _id: reviewId, reviewStatus: ReviewStatus.ACTIVE }).exec();
		if (!review) throw new BadRequestException(Message.NO_DATA_FOUND);

		const me = String(memberId);
		let likes: string[] = (review.get('reviewLikes') ?? []).map((id: ObjectId) => String(id));
		let dislikes: string[] = (review.get('reviewDislikes') ?? []).map((id: ObjectId) => String(id));

		if (reaction === ReviewReaction.LIKE) {
			if (likes.includes(me)) likes = likes.filter((id) => id !== me);
			else {
				likes.push(me);
				dislikes = dislikes.filter((id) => id !== me);
			}
		} else {
			if (dislikes.includes(me)) dislikes = dislikes.filter((id) => id !== me);
			else {
				dislikes.push(me);
				likes = likes.filter((id) => id !== me);
			}
		}

		await this.reviewModel
			.findByIdAndUpdate(reviewId, {
				reviewLikes: likes.map((id) => new Types.ObjectId(id)),
				reviewDislikes: dislikes.map((id) => new Types.ObjectId(id)),
			})
			.exec();

		return {
			_id: reviewId,
			likesCount: likes.length,
			dislikesCount: dislikes.length,
			myReaction: likes.includes(me) ? ReviewReaction.LIKE : dislikes.includes(me) ? ReviewReaction.DISLIKE : undefined,
		};
	}

	public async getReviewSummary(target: { carId?: ObjectId; sellerId?: ObjectId }): Promise<ReviewSummary> {
		const match: T = { reviewStatus: ReviewStatus.ACTIVE };
		if (target.carId) match.carId = target.carId;
		if (target.sellerId) match.sellerId = target.sellerId;

		const result = await this.reviewModel
			.aggregate([
				{ $match: match },
				{
					$group: {
						_id: null,
						averageRating: { $avg: '$reviewRating' },
						totalReviews: { $sum: 1 },
						r1: { $sum: { $cond: [{ $eq: ['$reviewRating', 1] }, 1, 0] } },
						r2: { $sum: { $cond: [{ $eq: ['$reviewRating', 2] }, 1, 0] } },
						r3: { $sum: { $cond: [{ $eq: ['$reviewRating', 3] }, 1, 0] } },
						r4: { $sum: { $cond: [{ $eq: ['$reviewRating', 4] }, 1, 0] } },
						r5: { $sum: { $cond: [{ $eq: ['$reviewRating', 5] }, 1, 0] } },
					},
				},
			])
			.exec();

		if (!result[0]) return { averageRating: 0, totalReviews: 0, ratingDistribution: [] };
		const r = result[0];
		return {
			averageRating: Math.round(r.averageRating * 10) / 10,
			totalReviews: r.totalReviews,
			ratingDistribution: [
				{ star: 5, count: r.r5 },
				{ star: 4, count: r.r4 },
				{ star: 3, count: r.r3 },
				{ star: 2, count: r.r2 },
				{ star: 1, count: r.r1 },
			],
		};
	}

	public async updateReview(memberId: ObjectId, input: ReviewUpdate): Promise<Review> {
		const review = await this.reviewModel
			.findOne({ _id: input._id, memberId, reviewStatus: ReviewStatus.ACTIVE })
			.exec();
		if (!review) throw new BadRequestException(Message.NO_DATA_FOUND);
		const { _id, ...update } = input;
		const result = (await this.reviewModel.findByIdAndUpdate(_id, update, { new: true }).exec()) as unknown as Review;
		if (input.reviewRating !== undefined) {
			await this.recomputeCarRating(review.carId);
			await this.recomputeSellerRating(review.sellerId);
		}
		return result;
	}

	/** ADMIN **/
	public async getAllReviewsByAdmin(input: ReviewsInquiry): Promise<Reviews> {
		const { page, limit, sort, direction } = input;
		const sortBy: T = { [sort ?? 'createdAt']: direction ?? Direction.DESC };
		const result = await this.reviewModel
			.aggregate([
				{ $sort: sortBy },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupMember,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							{ $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'car' } },
							{ $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },
							{
								$addFields: {
									carTitle: '$car.carTitle',
									carImage: { $arrayElemAt: ['$car.carImages', 0] },
									likesCount: { $size: { $ifNull: ['$reviewLikes', []] } },
									dislikesCount: { $size: { $ifNull: ['$reviewDislikes', []] } },
								},
							},
							{ $project: { car: 0, reviewLikes: 0, reviewDislikes: 0 } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result[0] as Reviews;
	}

	public async removeReviewByAdmin(reviewId: ObjectId): Promise<Review> {
		const result = (await this.reviewModel
			.findByIdAndUpdate(reviewId, { reviewStatus: ReviewStatus.DELETE }, { new: true })
			.exec()) as unknown as Review;
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		await this.recomputeCarRating(result.carId);
		await this.recomputeSellerRating(result.sellerId);
		return result;
	}

	/** RATING AGGREGATES **/
	private async averageFor(match: T): Promise<{ avg: number; count: number }> {
		const rows = await this.reviewModel
			.aggregate([
				{ $match: { ...match, reviewStatus: ReviewStatus.ACTIVE } },
				{ $group: { _id: null, avg: { $avg: '$reviewRating' }, count: { $sum: 1 } } },
			])
			.exec();
		if (!rows[0]) return { avg: 0, count: 0 };
		return { avg: Math.round(rows[0].avg * 10) / 10, count: rows[0].count };
	}

	public async recomputeCarRating(carId: ObjectId): Promise<void> {
		const { avg, count } = await this.averageFor({ carId: shapeIntoMongoObjectId(carId) });
		await this.carModel.findByIdAndUpdate(carId, { carRating: avg, carReviews: count }).exec();
	}

	public async recomputeSellerRating(sellerId: ObjectId): Promise<void> {
		const { avg, count } = await this.averageFor({ sellerId: shapeIntoMongoObjectId(sellerId) });
		await this.memberModel.findByIdAndUpdate(sellerId, { memberRating: avg, memberReviews: count }).exec();
	}
}
