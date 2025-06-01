import { Logger, Inject, forwardRef } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url';
import { NotificationService } from '../components/notification/notification.service';

interface GuestUser {
	id: string;
	memberNick: string;
	isGuest: true;
}

type ChatUser = Member | GuestUser;

interface MessagePayload {
	event: string;
	text: string;
	memberData: ChatUser;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: ChatUser;
	action: string;
}

interface NotificationPayload {
	id: string;
	title: string;
	desc?: string;
	type: string;
	status: string;
	createdAt: Date;
}

interface MarkReadPayload {
	notificationIds: string[];
}

@WebSocketGateway({ transport: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;
	private clientsMap = new Map<WebSocket, ChatUser>();
	private messagesList: MessagePayload[] = [];
	private guestCounter: number = 0;

	constructor(
		private authService: AuthService,
		@Inject(forwardRef(() => NotificationService))
		private notificationService: NotificationService,
	) {}

	@WebSocketServer()
	server: Server;

	public afterInit(server: Server) {
		this.logger.verbose(`WebSocket Server Initialized total: [${this.summaryClient}]`);
	}

	private async retrieveAuth(req: any): Promise<ChatUser> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;
			if (token) {
				const member = await this.authService.verifyToken(token as string);
				if (member) return member;
			}
		} catch (err) {
			// Fall through to guest user creation
		}

		// Create a guest user if no valid token
		this.guestCounter++;
		return {
			id: `guest-${this.guestCounter}`,
			memberNick: `Guest-${this.guestCounter}`,
			isGuest: true,
		};
	}

	public async handleConnection(client: WebSocket, req: any) {
		const user = await this.retrieveAuth(req);
		this.clientsMap.set(client, user);
		this.summaryClient++;

		const clientNick: string = user.memberNick;
		this.logger.verbose(`Connection [${clientNick}] & total: [${this.summaryClient}]`);

		// Send connection info
		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: user,
			action: 'joined',
		};
		this.emitMessage(infoMsg);
		client.send(JSON.stringify({ event: 'getMessages', list: this.messagesList }));

		// Only handle notifications for authenticated users
		if (!('isGuest' in user)) {
			await this.handleGetNotifications(client);
		}
	}

	private async handleGetNotifications(client: WebSocket) {
		try {
			const user = this.clientsMap.get(client);
			if (!user || 'isGuest' in user) return;

			// Get unread notifications
			const unreadNotifications = await this.notificationService.getUnreadNotifications(user._id.toString());

			// Send notifications to the client
			if (unreadNotifications.length > 0) {
				client.send(
					JSON.stringify({
						event: 'notifications_list',
						data: unreadNotifications.map((notification) => ({
							id: notification._id.toString(),
							title: notification.notificationTitle,
							desc: notification.notificationDesc,
							type: notification.notificationType,
							status: notification.notificationStatus,
							createdAt: notification.createdAt,
						})),
					}),
				);
			}
		} catch (error) {
			this.logger.error('Error in handleGetNotifications:', error);
		}
	}

	@SubscribeMessage('get_notifications')
	public async handleGetNotificationsEvent(client: WebSocket): Promise<void> {
		await this.handleGetNotifications(client);
	}

	@SubscribeMessage('markNotificationsAsRead')
	public async handleMarkNotificationsAsRead(client: WebSocket, data: any): Promise<void> {
		try {
			const user = this.clientsMap.get(client);
			if (!user || 'isGuest' in user) return;

			// Handle both array of IDs or single ID
			const notificationIds = Array.isArray(data) ? data : [data];

			if (!notificationIds.length) return;

			// Get the notifications to mark as read
			const notifications = await this.notificationService.getNotificationsByIds(notificationIds, user._id.toString());

			if (notifications.length > 0) {
				// Mark notifications as read
				await this.notificationService.markMultipleAsRead(user._id.toString(), notifications);

				// Send status updates for notifications that were marked as read
				notifications.forEach((notification) => {
					client.send(
						JSON.stringify({
							event: 'notificationStatus',
							payload: {
								id: notification._id.toString(),
								status: 'READ',
							},
						}),
					);
				});
			}
		} catch (error) {
			this.logger.error('Error in handleMarkNotificationsAsRead:', error);
		}
	}

	public handleDisconnect(client: WebSocket) {
		const user = this.clientsMap.get(client);
		if (user) {
			this.summaryClient--;
			this.clientsMap.delete(client);

			const clientNick: string = user.memberNick;
			this.logger.verbose(`Disconnected [${clientNick}] & total  [${this.summaryClient}]`);

			const infoMsg: InfoPayload = {
				event: 'info',
				totalClients: this.summaryClient,
				memberData: user,
				action: 'left',
			};
			this.broadcastMessage(client, infoMsg);
		}
	}

	@SubscribeMessage('message')
	public async handleMessage(client: WebSocket, payload: string): Promise<void> {
		const user = this.clientsMap.get(client);
		if (!user) return;

		const newMessage: MessagePayload = {
			event: 'message',
			text: payload,
			memberData: user,
		};

		this.logger.verbose(`NEW MESSAGE [${user.memberNick}] : ${payload}`);

		this.messagesList.push(newMessage);
		if (this.messagesList.length >= 5) this.messagesList.splice(0, this.messagesList.length - 5);

		this.emitMessage(newMessage);
	}

	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	// Method for sending notifications
	public sendNotification(userId: string, notification: NotificationPayload) {
		let notificationsSent = 0;
		this.server.clients.forEach((client) => {
			const user = this.clientsMap.get(client);

			if (client.readyState === WebSocket.OPEN) {
				if (user && !('isGuest' in user) && user._id.toString() === userId) {
					client.send(
						JSON.stringify({
							event: 'notification',
							payload: notification,
						}),
					);
					notificationsSent++;
				}
			}
		});
	}
}

/*
 MESSAGE TARGET:
    1. Client (only client)
    2. Broadcast (except clients )
    3. Emit (all  clients)
 */
