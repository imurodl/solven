import { Schema } from 'mongoose';
import {
	CarAvailability,
	CarColor,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarOptions,
	CarStatus,
	CarTransmission,
	CarType,
} from '../libs/enums/car.enum';

const CarSchema = new Schema(
	{
		carType: {
			type: String,
			enum: CarType,
			required: true,
		},

		carBrand: {
			type: String,
			required: true,
		},

		carModel: {
			type: String,
			required: true,
		},

		carStatus: {
			type: String,
			enum: CarStatus,
			default: CarStatus.ACTIVE,
		},

		carLocation: {
			type: String,
			enum: CarLocation,
			required: true,
		},

		carAddress: {
			type: String,
			required: true,
		},

		carFuelType: {
			type: String,
			enum: CarFuelType,
			required: true,
		},

		carTransmission: {
			type: String,
			enum: CarTransmission,
			required: true,
		},

		carTitle: {
			type: String,
			required: true,
		},

		carPrice: {
			type: Number,
			required: true,
		},

		carSeats: {
			type: Number,
			required: true,
		},

		carOptions: {
			type: [String],
			enum: CarOptions,
			default: [],
		},

		carColor: {
			type: String,
			enum: CarColor,
			required: true,
		},

		carMileage: {
			type: Number,
			required: true,
		},

		carViews: {
			type: Number,
			default: 0,
		},

		carLikes: {
			type: Number,
			default: 0,
		},

		carComments: {
			type: Number,
			default: 0,
		},

		carRank: {
			type: Number,
			default: 0,
		},

		carImages: {
			type: [String],
			required: true,
		},

		manufacturedAt: {
			type: Number,
			required: true,
		},

		carDesc: {
			type: String,
		},

		carBarter: {
			type: Boolean,
			default: false,
		},

		carRent: {
			type: Boolean,
			default: false,
		},

		// Hot deal: a discounted price that is only visible inside its time window.
		// Windows are staggered per car so the homepage deals rotate.
		carSalePrice: {
			type: Number,
		},

		carIsOnSale: {
			type: Boolean,
			default: false,
		},

		carSaleStartsAt: {
			type: Date,
		},

		carSaleExpiresAt: {
			type: Date,
		},

		carAvailability: {
			type: String,
			enum: CarAvailability,
			default: CarAvailability.AVAILABLE,
		},

		carCondition: {
			type: String,
			enum: CarCondition,
			default: CarCondition.USED,
		},

		carRating: {
			type: Number,
			default: 0,
		},

		carReviews: {
			type: Number,
			default: 0,
		},

		carSoldCount: {
			type: Number,
			default: 0,
		},

		// Machine translations { en: {title, desc}, kr: ..., ru: ..., uz: ... };
		// additive — when absent the frontend shows the source text.
		carTranslations: {
			type: Schema.Types.Mixed,
			default: {},
		},

		// Photo attribution (licensed stock photos), one entry per image.
		carImageCredits: {
			type: [String],
			default: [],
		},

		car3dModel: {
			type: String,
		},

		carVin: {
			type: String,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'cars' },
);

CarSchema.index(
	{
		carBrand: 1,
		carModel: 1,
		manufacturedAt: 1,
		carMileage: 1,
		carPrice: 1,
		memberId: 1, // who posted it
	},
	{ unique: true },
);

// Query indexes for public car search (every public query filters by carStatus)
CarSchema.index({ carStatus: 1, createdAt: -1 });
CarSchema.index({ carStatus: 1, carPrice: 1 });
CarSchema.index({ memberId: 1, carStatus: 1 });
CarSchema.index({ carStatus: 1, carIsOnSale: 1, carSaleExpiresAt: 1 });
CarSchema.index({ carStatus: 1, carAvailability: 1 });
CarSchema.index({ carStatus: 1, carRating: -1 });

export default CarSchema;
