import { Schema } from 'mongoose';

const ChatMessageSchema = new Schema(
	{
		text: {
			type: String,
			required: true,
		},

		// Denormalized snapshot of the sender (Member or guest) so history renders
		// without extra lookups and matches the live socket payload shape.
		memberData: {
			type: Schema.Types.Mixed,
		},
	},
	{ timestamps: true, collection: 'chatMessages' },
);

ChatMessageSchema.index({ createdAt: -1 });

export default ChatMessageSchema;
