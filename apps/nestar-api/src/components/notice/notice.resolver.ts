import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { NoticeService } from './notice.service';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { AllNoticesInquiry } from '../../libs/dto/notice/notice.inquiry';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { GraphQLString } from 'graphql';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async createNotice(@Args('input') input: NoticeInput, @AuthMember('_id') memberId: ObjectId): Promise<Notice> {
		console.log('Mutation: createNotice');
		return await this.noticeService.createNotice(memberId, input);
	}
	@UseGuards(WithoutGuard)
	@Query(() => Notices)
	public async getAllNotices(@Args('input') input: AllNoticesInquiry): Promise<Notices> {
		console.log('Query: getAllNotices');
		return await this.noticeService.getAllNotices(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Notice)
	public async getNotice(@Args('noticeId', { type: () => GraphQLString }) noticeId: string): Promise<Notice> {
		console.log('Query: getNotice');
		const objectId = shapeIntoMongoObjectId(noticeId);
		return await this.noticeService.getNotice(objectId);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async updateNotice(
		@Args('noticeId', { type: () => GraphQLString }) noticeId: string,
		@Args('input') input: NoticeUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notice> {
		console.log('Mutation: updateNotice');
		const objectId = shapeIntoMongoObjectId(noticeId);
		return await this.noticeService.updateNotice(memberId, objectId, input);
	}

	@UseGuards(AuthGuard, RolesGuard)
	@Roles(MemberType.ADMIN)
	@Mutation(() => Notice)
	public async removeNotice(
		@Args('noticeId', { type: () => GraphQLString }) noticeId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notice> {
		console.log('Mutation: removeNotice');

		const objectId = shapeIntoMongoObjectId(noticeId);
		return await this.noticeService.removeNotice(memberId, objectId);
	}
}
