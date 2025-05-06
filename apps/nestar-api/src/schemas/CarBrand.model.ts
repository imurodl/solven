import { Schema } from 'mongoose';

const CarBrandSchema = new Schema(
	{
		carBrandName: {
			type: String,
			required: true,
			unique: true,
		},

		carBrandModels: {
			type: [String],
			required: true,
		},
	},
	{ timestamps: true, collection: 'carBrands' },
);

export default CarBrandSchema;
