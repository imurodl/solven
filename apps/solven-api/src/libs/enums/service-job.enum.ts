import { registerEnumType } from '@nestjs/graphql';

export enum ServiceType {
	ENGINE = 'ENGINE',
	TRANSMISSION = 'TRANSMISSION',
	BODY = 'BODY',
	PAINT = 'PAINT',
	TIRE = 'TIRE',
	ELECTRIC = 'ELECTRIC',
	DETAILING = 'DETAILING',
	INSPECTION = 'INSPECTION',
	OTHER = 'OTHER',
}
registerEnumType(ServiceType, { name: 'ServiceType' });

export enum ServiceJobStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(ServiceJobStatus, { name: 'ServiceJobStatus' });
