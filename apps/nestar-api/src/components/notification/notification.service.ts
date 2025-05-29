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

	async getNotificationsByIds(notificationIds: string[], userId: string): Promise<Notification[]> {
		return this.notificationModel
			.find({
				_id: { $in: notificationIds },
				receiverId: userId,
				notificationStatus: NotificationStatus.WAIT,
			})
			.exec();
	}

	async markAsRead(notificationId: string, userId: string): Promise<boolean> {
		try {
			const notification = await this.notificationModel.findOneAndUpdate(
				{
					_id: notificationId,
					receiverId: userId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{
					notificationStatus: NotificationStatus.READ,
				},
				{ new: true },
			);

			if (notification) {
				// Notify the client that the notification has been read
				this.socketGateway.sendNotification(userId, {
					id: notification._id.toString(),
					title: notification.notificationTitle,
					desc: notification.notificationDesc,
					type: notification.notificationType,
					status: NotificationStatus.READ,
					createdAt: notification.createdAt,
				});
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	}

	async markMultipleAsRead(userId: string, notifications: Notification[]): Promise<void> {
		try {
			const notificationIds = notifications.map((n) => n._id);

			await this.notificationModel.updateMany(
				{
					_id: { $in: notificationIds },
					receiverId: userId,
					notificationStatus: NotificationStatus.WAIT,
				},
				{
					notificationStatus: NotificationStatus.READ,
				},
			);

			// Send status updates for each notification
			for (const notification of notifications) {
				this.socketGateway.sendNotification(userId, {
					id: notification._id.toString(),
					title: notification.notificationTitle,
					desc: notification.notificationDesc,
					type: notification.notificationType,
					status: NotificationStatus.READ,
					createdAt: notification.createdAt,
				});
			}
		} catch (error) {
			throw error;
		}
	}
}
