import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	MESSAGE = 'MESSAGE',
	ORDER = 'ORDER',
	REVIEW = 'REVIEW',
	FOLLOW = 'FOLLOW',
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	CAR = 'CAR',
	ORDER = 'ORDER',
	SERVICE_JOB = 'SERVICE_JOB',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});
