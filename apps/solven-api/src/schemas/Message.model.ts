import { Schema } from 'mongoose';
import { ConversationKind, MessageStatus } from '../libs/enums/message.enum';

const MessageSchema = new Schema(
	{
		conversationId: { type: String, required: true, index: true },
		kind: { type: String, enum: ConversationKind, default: ConversationKind.CAR },
		carId: { type: Schema.Types.ObjectId, ref: 'Car' },
		senderId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		receiverId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		message: { type: String, required: true },
		messageStatus: { type: String, enum: MessageStatus, default: MessageStatus.WAIT },
	},
	{ timestamps: true, collection: 'messages' },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, messageStatus: 1 });

export default MessageSchema;
