import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { Notification } from '../../libs/dto/notification/notification';
import { NotificationStatus } from '../../libs/enums/notification.enum';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification')
		private readonly notificationModel: Model<Notification>,
		@Inject(forwardRef(() => SocketGateway))
		private readonly socketGateway: SocketGateway,
	) {}

	async createNotification(input: NotificationInput): Promise<Notification> {
		const notification = await this.notificationModel.create({
			...input,
			notificationStatus: NotificationStatus.WAIT,
		});

		// Send real-time notification
		this.socketGateway.sendNotification(notification.receiverId.toString(), {
			id: notification._id.toString(),
			title: notification.notificationTitle,
			desc: notification.notificationDesc,
			type: notification.notificationType,
			status: notification.notificationStatus,
			createdAt: notification.createdAt,
		});

		return notification;
	}

	async getUnreadNotifications(userId: string): Promise<Notification[]> {
		return this.notificationModel
			.find({
				receiverId: userId,
				notificationStatus: NotificationStatus.WAIT,
			})
			.sort({ createdAt: -1 })
			.exec();
	}
}
