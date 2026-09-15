import { registerEnumType } from '@nestjs/graphql';

export enum CouponType {
	PERCENT = 'PERCENT',
	FIXED = 'FIXED',
}
registerEnumType(CouponType, { name: 'CouponType' });

export enum CouponStatus {
	ACTIVE = 'ACTIVE',
	PAUSED = 'PAUSED',
}
registerEnumType(CouponStatus, { name: 'CouponStatus' });
