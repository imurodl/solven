import { Schema } from 'mongoose';

const CarBrandSchema = new Schema(
	{
		brandName: {
			type: String,
			required: true,
			unique: true,
		},

		carModels: {
			type: [String],
			required: true,
		},
	},
	{ timestamps: true, collection: 'carBrands' },
);

export default CarBrandSchema;
