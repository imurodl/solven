import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { T } from '../../libs/types/common';
import { OrderStatus } from '../../libs/enums/order.enum';
import { CarStatus } from '../../libs/enums/car.enum';
import { ReviewStatus } from '../../libs/enums/review.enum';

@ObjectType()
export class ActivityItem {
	@Field(() => String)
	type: string; // ORDER | REVIEW | LISTING

	@Field(() => String)
	title: string;

	@Field(() => String, { nullable: true })
	subtitle?: string;

	@Field(() => String, { nullable: true })
	carId?: string;

	@Field(() => String, { nullable: true })
	image?: string;

	@Field(() => Int, { nullable: true })
	rating?: number;

	@Field(() => Date)
	createdAt: Date;
}

// Real recent activity for the social-proof toast (no fabricated events).
// Buyer identity is never exposed: orders show only the delivery city.
@Injectable()
export class ActivityService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<T>,
		@InjectModel('Review') private readonly reviewModel: Model<T>,
		@InjectModel('Car') private readonly carModel: Model<T>,
	) {}

	public async getRecentActivity(limit = 12): Promise<ActivityItem[]> {
		const per = Math.max(2, Math.ceil(limit / 3));
		const [orders, reviews, cars] = await Promise.all([
			this.orderModel
				.find({
					orderStatus: { $in: [OrderStatus.ACCEPTED, OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
				})
				.sort({ createdAt: -1 })
				.limit(per)
				.select('carId carSnapshot deliveryInfo.city createdAt')
				.lean()
				.exec(),
			this.reviewModel
				.aggregate([
					{ $match: { reviewStatus: ReviewStatus.ACTIVE } },
					{ $sort: { createdAt: -1 } },
					{ $limit: per },
					{ $lookup: { from: 'members', localField: 'memberId', foreignField: '_id', as: 'm' } },
					{ $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'c' } },
					{
						$project: {
							carId: 1,
							reviewRating: 1,
							createdAt: 1,
							nick: { $arrayElemAt: ['$m.memberNick', 0] },
							carTitle: { $arrayElemAt: ['$c.carTitle', 0] },
							image: { $arrayElemAt: [{ $arrayElemAt: ['$c.carImages', 0] }, 0] },
						},
					},
				])
				.exec(),
			this.carModel
				.find({ carStatus: CarStatus.ACTIVE })
				.sort({ createdAt: -1 })
				.limit(per)
				.select('carTitle carImages carLocation createdAt')
				.lean()
				.exec(),
		]);

		const items: ActivityItem[] = [
			...orders.map((o: T) => ({
				type: 'ORDER',
				title: o.carSnapshot?.carTitle ?? 'a car',
				subtitle: o.deliveryInfo?.city ? `Someone in ${o.deliveryInfo.city} reserved` : 'Someone just reserved',
				carId: String(o.carId),
				image: o.carSnapshot?.carImage,
				createdAt: o.createdAt,
			})),
			...reviews.map((r: T) => ({
				type: 'REVIEW',
				title: r.carTitle ?? 'a car',
				subtitle: `${r.nick ?? 'A buyer'} left a review`,
				carId: String(r.carId),
				image: r.image,
				rating: r.reviewRating,
				createdAt: r.createdAt,
			})),
			...cars.map((c: T) => ({
				type: 'LISTING',
				title: c.carTitle,
				subtitle: `New listing in ${String(c.carLocation).charAt(0)}${String(c.carLocation).slice(1).toLowerCase()}`,
				carId: String(c._id),
				image: c.carImages?.[0],
				createdAt: c.createdAt,
			})),
		];
		return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
	}
}
