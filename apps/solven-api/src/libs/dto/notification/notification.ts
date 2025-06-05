import { Field, ID, ObjectType } from '@nestjs/graphql';
import { NotificationType, NotificationStatus, NotificationGroup } from '../../enums/notification.enum';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id: string;

	@Field(() => NotificationType)
	notificationType: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup: NotificationGroup;

	@Field()
	notificationTitle: string;

	@Field({ nullable: true })
	notificationDesc?: string;

	@Field(() => String)
	authorId: string;

	@Field(() => String)
	receiverId: string;

	@Field(() => String, { nullable: true })
	carId?: string;

	@Field(() => String, { nullable: true })
	articleId?: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;
}
