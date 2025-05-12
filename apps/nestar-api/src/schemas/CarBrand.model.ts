import { Schema } from 'mongoose';
import { CarBrandStatus } from '../libs/enums/car.enum';

const CarBrandSchema = new Schema(
	{
		carBrandName: {
			type: String,
			required: true,
			unique: true,
		},

		carBrandImg: {
			type: String,
			default: '',
		},

		carBrandStatus: {
			type: String,
			enum: CarBrandStatus,
			default: CarBrandStatus.ACTIVE,
		},

		carBrandModels: {
			type: [String],
			required: true,
		},
	},
	{ timestamps: true, collection: 'carBrands' },
);

export default CarBrandSchema;
