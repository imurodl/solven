import { Schema } from 'mongoose';
import { DeliveryMethod, OrderStatus } from '../libs/enums/order.enum';

// Immutable copy of the listing at order time so history survives later edits.
const CarSnapshotSchema = new Schema(
	{
		carTitle: { type: String, required: true },
		carImage: { type: String },
		carPrice: { type: Number, required: true },
		carBrand: { type: String },
		carModel: { type: String },
		manufacturedAt: { type: Number },
		carMileage: { type: Number },
	},
	{ _id: false },
);

const DeliveryInfoSchema = new Schema(
	{
		fullName: { type: String, required: true },
		phone: { type: String, required: true },
		address: { type: String },
		city: { type: String },
		note: { type: String },
	},
	{ _id: false },
);

const OrderSchema = new Schema(
	{
		orderId: { type: String, required: true, unique: true },
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		sellerId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		carId: { type: Schema.Types.ObjectId, required: true, ref: 'Car' },
		carSnapshot: { type: CarSnapshotSchema, required: true },
		orderStatus: { type: String, enum: OrderStatus, default: OrderStatus.PENDING },
		deliveryMethod: { type: String, enum: DeliveryMethod, default: DeliveryMethod.PICKUP },
		deliveryInfo: { type: DeliveryInfoSchema, required: true },
		orderTotal: { type: Number, required: true },
		orderDeposit: { type: Number, required: true },
		orderDiscount: { type: Number, default: 0 },
		orderCouponCode: { type: String },
		acceptedAt: { type: Date },
		paidAt: { type: Date },
		deliveredAt: { type: Date },
		completedAt: { type: Date },
		cancelledAt: { type: Date },
		cancelReason: { type: String },
		returnRequestedAt: { type: Date },
		returnReason: { type: String },
		returnedAt: { type: Date },
	},
	{ timestamps: true, collection: 'orders' },
);

OrderSchema.index({ memberId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ carId: 1, orderStatus: 1 });

export default OrderSchema;
