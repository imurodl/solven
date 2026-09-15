import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { ConversationKind, MessageStatus } from '../../enums/message.enum';
import { Member } from '../member/member';

@ObjectType()
export class Message {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	conversationId: string;

	@Field(() => ConversationKind)
	kind: ConversationKind;

	@Field(() => String, { nullable: true })
	carId?: ObjectId;

	@Field(() => String)
	senderId: ObjectId;

	@Field(() => String)
	receiverId: ObjectId;

	@Field(() => String)
	message: string;

	@Field(() => MessageStatus)
	messageStatus: MessageStatus;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	senderData?: Member;
}

@ObjectType()
export class Conversation {
	@Field(() => String)
	conversationId: string;

	@Field(() => ConversationKind)
	kind: ConversationKind;

	@Field(() => String, { nullable: true })
	carId?: ObjectId;

	@Field(() => String, { nullable: true })
	carTitle?: string;

	@Field(() => String, { nullable: true })
	carImage?: string;

	@Field(() => String)
	lastMessage: string;

	@Field(() => Date)
	lastMessageAt: Date;

	@Field(() => Int)
	unreadCount: number;

	@Field(() => Member, { nullable: true })
	partner?: Member;
}
