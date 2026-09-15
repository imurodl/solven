import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Throttle } from '@nestjs/throttler';
import { MessageService } from './message.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Conversation, Message } from '../../libs/dto/message/message';
import { ReplyMessageInput, SendMessageInput, SendServiceRequestInput } from '../../libs/dto/message/message.input';

@Resolver()
export class MessageResolver {
	private readonly logger = new Logger(MessageResolver.name);

	constructor(private readonly messageService: MessageService) {}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		this.logger.log('Mutation: sendMessage');
		return await this.messageService.sendMessage(memberId, input);
	}

	@Throttle({ default: { limit: 60, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async replyMessage(
		@Args('input') input: ReplyMessageInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		this.logger.log('Mutation: replyMessage');
		return await this.messageService.replyMessage(memberId, input);
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(AuthGuard)
	@Mutation(() => Message)
	public async sendServiceRequest(
		@Args('input') input: SendServiceRequestInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message> {
		this.logger.log('Mutation: sendServiceRequest');
		return await this.messageService.sendServiceRequest(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Conversation])
	public async getMyConversations(@AuthMember('_id') memberId: ObjectId): Promise<Conversation[]> {
		this.logger.log('Query: getMyConversations');
		return await this.messageService.getMyConversations(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadMessageCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		return await this.messageService.getUnreadCount(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => [Message])
	public async getConversation(
		@Args('conversationId') conversationId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Message[]> {
		this.logger.log('Query: getConversation');
		return await this.messageService.getConversation(memberId, conversationId);
	}
}
