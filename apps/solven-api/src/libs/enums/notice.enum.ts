import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	FAQ = 'FAQ',
	TERMS = 'TERMS',
	NOTICE = 'NOTICE',
}
registerEnumType(NoticeCategory, {
	name: 'NoticeCategory',
});

export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, {
	name: 'NoticeStatus',
});
