import { registerEnumType } from '@nestjs/graphql';

// Deal lifecycle. The seller must ACCEPT before the buyer pays the deposit;
// COMPLETED marks the car SOLD. CANCELLED/RETURNED release the car again.
export enum OrderStatus {
	PENDING = 'PENDING',
	ACCEPTED = 'ACCEPTED',
	PAID = 'PAID',
	DELIVERED = 'DELIVERED',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
	RETURN_REQUESTED = 'RETURN_REQUESTED',
	RETURNED = 'RETURNED',
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

export enum DeliveryMethod {
	PICKUP = 'PICKUP',
	DELIVERY = 'DELIVERY',
}
registerEnumType(DeliveryMethod, { name: 'DeliveryMethod' });
