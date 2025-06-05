import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationType, NotificationGroup } from '../../enums/notification.enum';

@InputType()
export class NotificationInput {
	@Field(() => NotificationType)
	@IsEnum(NotificationType)
	@IsNotEmpty()
	notificationType: NotificationType;

	@Field(() => NotificationGroup)
	@IsEnum(NotificationGroup)
	@IsNotEmpty()
	notificationGroup: NotificationGroup;

	@Field()
	@IsString()
	@IsNotEmpty()
	notificationTitle: string;

	@Field({ nullable: true })
	@IsString()
	@IsOptional()
	notificationDesc?: string;

	@Field(() => String)
	@IsMongoId()
	@IsNotEmpty()
	authorId: string;

	@Field(() => String)
	@IsMongoId()
	@IsNotEmpty()
	receiverId: string;

	@Field(() => String, { nullable: true })
	@IsMongoId()
	@IsOptional()
	carId?: string;

	@Field(() => String, { nullable: true })
	@IsMongoId()
	@IsOptional()
	articleId?: string;
}
