import { Schema } from 'mongoose';
import {
	CarColor,
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

export default CarSchema;
