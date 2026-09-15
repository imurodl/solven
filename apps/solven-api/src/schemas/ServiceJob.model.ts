import { Schema } from 'mongoose';
import { CarLocation } from '../libs/enums/car.enum';
import { ServiceJobStatus, ServiceType } from '../libs/enums/service-job.enum';

// A mechanic's showcase of completed work (the car-world equivalent of a
// repaired-furniture listing): what was fixed, on which car, from what price.
const ServiceJobSchema = new Schema(
	{
		serviceType: { type: String, enum: ServiceType, required: true },
		serviceStatus: { type: String, enum: ServiceJobStatus, default: ServiceJobStatus.ACTIVE },
		serviceTitle: { type: String, required: true },
		serviceDesc: { type: String },
		carBrand: { type: String, required: true },
		carModel: { type: String, required: true },
		manufacturedAt: { type: Number },
		servicePrice: { type: Number, required: true },
		serviceDuration: { type: Number, default: 1 }, // hours
		serviceImages: { type: [String], required: true },
		serviceLocation: { type: String, enum: CarLocation, required: true },
		serviceAddress: { type: String, required: true },
		serviceViews: { type: Number, default: 0 },
		serviceLikes: { type: Number, default: 0 },
		serviceComments: { type: Number, default: 0 },
		serviceRank: { type: Number, default: 0 },
		serviceTranslations: { type: Schema.Types.Mixed, default: {} },
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		deletedAt: { type: Date },
	},
	{ timestamps: true, collection: 'serviceJobs' },
);

ServiceJobSchema.index({ serviceStatus: 1, createdAt: -1 });
ServiceJobSchema.index({ memberId: 1, serviceStatus: 1 });

export default ServiceJobSchema;
