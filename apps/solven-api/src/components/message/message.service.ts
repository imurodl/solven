import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Conversation, Message } from '../../libs/dto/message/message';
import { ReplyMessageInput, SendMessageInput, SendServiceRequestInput } from '../../libs/dto/message/message.input';
import { ConversationKind, MessageStatus } from '../../libs/enums/message.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { Message as Msg } from '../../libs/enums/common.enum';
import { CarStatus } from '../../libs/enums/car.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class MessageService {
	private readonly logger = new Logger(MessageService.name);

	constructor(
		@InjectModel('Message') private readonly messageModel: Model<Message>,
		@InjectModel('Car') private readonly carModel: Model<T>,
		@InjectModel('Member') private readonly memberModel: Model<T>,
		private readonly notificationService: NotificationService,
		private readonly socketGateway: SocketGateway,
	) {}

	// One conversation per (car, buyer, seller); participants sorted so both sides derive the same id.
	private carConversationId(carId: string, a: string, b: string): string {
		return `${[String(a), String(b)].sort().join('_')}_${carId}`;
	}

	private serviceConversationId(a: string, b: string): string {
		return `${[String(a), String(b)].sort().join('_')}_service`;
	}

	public async sendMessage(senderId: ObjectId, input: SendMessageInput): Promise<Message> {
		const car = await this.carModel.findOne({ _id: input.carId, carStatus: CarStatus.ACTIVE }).lean().exec();
		if (!car) throw new BadRequestException(Msg.NO_DATA_FOUND);
		const receiverId = car.memberId;
		if (String(receiverId) === String(senderId)) throw new BadRequestException(Msg.SELF_MESSAGE_DENIED);

		const parts = [input.message.trim()];
		if (input.name) parts.push(`👤 ${input.name}`);
		if (input.phone) parts.push(`📞 ${input.phone}`);

		const conversationId = this.carConversationId(String(car._id), String(senderId), String(receiverId));
		const message = await this.messageModel.create({
			conversationId,
			kind: ConversationKind.CAR,
			carId: car._id,
			senderId,
			receiverId,
			message: parts.join('\n'),
		});

		await this.notifyNew(senderId, receiverId, conversationId, input.message, String(car._id), car.carTitle, false);
		return message as unknown as Message;
	}

	public async replyMessage(senderId: ObjectId, input: ReplyMessageInput): Promise<Message> {
		const last = await this.messageModel
			.findOne({ conversationId: input.conversationId })
			.sort({ createdAt: -1 })
			.exec();
		if (!last) throw new BadRequestException(Msg.NO_DATA_FOUND);
		const me = String(senderId);
		if (me !== String(last.senderId) && me !== String(last.receiverId)) {
			throw new BadRequestException(Msg.NOT_CONVERSATION_MEMBER);
		}
		const receiverId = me === String(last.senderId) ? last.receiverId : last.senderId;

		const message = await this.messageModel.create({
			conversationId: input.conversationId,
			kind: last.kind,
			carId: last.carId,
			senderId,
			receiverId,
			message: input.message.trim(),
		});

		const car = last.carId ? await this.carModel.findById(last.carId).lean().exec() : null;
		await this.notifyNew(
			senderId,
			receiverId,
			input.conversationId,
			input.message,
			last.carId ? String(last.carId) : undefined,
			car?.carTitle,
			last.kind === ConversationKind.SERVICE,
		);
		return message as unknown as Message;
	}

	public async sendServiceRequest(senderId: ObjectId, input: SendServiceRequestInput): Promise<Message> {
		const mechanic = await this.memberModel.findOne({ _id: input.mechanicId, memberType: MemberType.MECHANIC }).exec();
		if (!mechanic) throw new BadRequestException(Msg.NO_DATA_FOUND);
		if (String(mechanic._id) === String(senderId)) throw new BadRequestException(Msg.SELF_MESSAGE_DENIED);

		const parts = [input.message.trim()];
		if (input.carInfo) parts.push(`🚗 ${input.carInfo}`);
		if (input.phone) parts.push(`📞 ${input.phone}`);

		const conversationId = this.serviceConversationId(String(senderId), String(mechanic._id));
		const message = await this.messageModel.create({
			conversationId,
			kind: ConversationKind.SERVICE,
			senderId,
			receiverId: mechanic._id,
			message: parts.join('\n'),
		});

		await this.notifyNew(senderId, mechanic._id as T, conversationId, input.message, undefined, undefined, true);
		return message as unknown as Message;
	}

	private async notifyNew(
		senderId: ObjectId,
		receiverId: T,
		conversationId: string,
		text: string,
		carId?: string,
		carTitle?: string,
		isService = false,
	): Promise<void> {
		const sender = await this.memberModel.findById(senderId).lean().exec();
		const nick = sender?.memberNick ?? 'Someone';
		const short = text.length > 60 ? `${text.slice(0, 60)}...` : text;
		await this.notificationService
			.createNotification({
				notificationType: NotificationType.MESSAGE,
				notificationGroup: isService ? NotificationGroup.SERVICE_JOB : NotificationGroup.CAR,
				notificationTitle: isService ? 'New service request' : carTitle ? `Message about ${carTitle}` : 'New message',
				notificationDesc: `${nick}: ${short}`,
				authorId: String(senderId),
				receiverId: String(receiverId),
				conversationId,
				...(carId ? { carId } : {}),
			})
			.catch((err) => this.logger.warn(`message notification failed: ${err?.message}`));
		this.socketGateway.emitToMember(String(receiverId), 'dm', {
			conversationId,
			from: String(senderId),
			preview: short,
		});
	}

	public async getMyConversations(memberId: ObjectId): Promise<Conversation[]> {
		const me = new Types.ObjectId(String(memberId));
		const result = await this.messageModel.aggregate([
			{ $match: { $or: [{ senderId: me }, { receiverId: me }] } },
			{ $sort: { createdAt: -1 } },
			{
				$group: {
					_id: '$conversationId',
					carId: { $first: '$carId' },
					kind: { $first: '$kind' },
					lastMessage: { $first: '$message' },
					lastMessageAt: { $first: '$createdAt' },
					lastSender: { $first: '$senderId' },
					lastReceiver: { $first: '$receiverId' },
					unreadCount: {
						$sum: {
							$cond: [{ $and: [{ $eq: ['$receiverId', me] }, { $eq: ['$messageStatus', MessageStatus.WAIT] }] }, 1, 0],
						},
					},
				},
			},
			{ $addFields: { partnerId: { $cond: [{ $eq: ['$lastSender', me] }, '$lastReceiver', '$lastSender'] } } },
			{ $lookup: { from: 'members', localField: 'partnerId', foreignField: '_id', as: 'partner' } },
			{ $unwind: { path: '$partner', preserveNullAndEmptyArrays: true } },
			{ $lookup: { from: 'cars', localField: 'carId', foreignField: '_id', as: 'car' } },
			{ $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },
			{ $sort: { lastMessageAt: -1 } },
			{
				$project: {
					_id: 0,
					conversationId: '$_id',
					carId: 1,
					kind: 1,
					carTitle: '$car.carTitle',
					carImage: { $arrayElemAt: ['$car.carImages', 0] },
					lastMessage: 1,
					lastMessageAt: 1,
					unreadCount: 1,
					partner: 1,
				},
			},
		]);
		return result as Conversation[];
	}

	public async getUnreadCount(memberId: ObjectId): Promise<number> {
		return this.messageModel.countDocuments({ receiverId: memberId, messageStatus: MessageStatus.WAIT }).exec();
	}

	public async getConversation(memberId: ObjectId, conversationId: string): Promise<Message[]> {
		const me = new Types.ObjectId(String(memberId));
		const exists = await this.messageModel
			.findOne({ conversationId, $or: [{ senderId: me }, { receiverId: me }] })
			.exec();
		if (!exists) throw new BadRequestException(Msg.NOT_CONVERSATION_MEMBER);

		await this.messageModel
			.updateMany(
				{ conversationId, receiverId: me, messageStatus: MessageStatus.WAIT },
				{ messageStatus: MessageStatus.READ },
			)
			.exec();

		const result = await this.messageModel.aggregate([
			{ $match: { conversationId } },
			{ $sort: { createdAt: 1 } },
			{ $limit: 500 },
			{ $lookup: { from: 'members', localField: 'senderId', foreignField: '_id', as: 'senderData' } },
			{ $unwind: { path: '$senderData', preserveNullAndEmptyArrays: true } },
		]);
		return result as Message[];
	}
}
