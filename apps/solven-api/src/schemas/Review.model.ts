import { Schema } from 'mongoose';
import { ReviewStatus } from '../libs/enums/review.enum';

const ReviewSchema = new Schema(
	{
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		carId: { type: Schema.Types.ObjectId, required: true, ref: 'Car' },
		// The seller at the time of the review; keeps seller ratings cheap to recompute.
		sellerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		orderId: { type: Schema.Types.ObjectId, required: true, ref: 'Order' },
		reviewRating: { type: Number, required: true, min: 1, max: 5 },
		reviewContent: { type: String, required: true },
		reviewImages: { type: [String], default: [] },
		reviewLikes: { type: [Schema.Types.ObjectId], default: [], ref: 'Member' },
		reviewDislikes: { type: [Schema.Types.ObjectId], default: [], ref: 'Member' },
		reviewStatus: { type: String, enum: ReviewStatus, default: ReviewStatus.ACTIVE },
	},
	{ timestamps: true, collection: 'reviews' },
);

ReviewSchema.index({ memberId: 1, carId: 1, orderId: 1 }, { unique: true });
ReviewSchema.index({ carId: 1, reviewStatus: 1, createdAt: -1 });
ReviewSchema.index({ sellerId: 1, reviewStatus: 1, createdAt: -1 });

export default ReviewSchema;
