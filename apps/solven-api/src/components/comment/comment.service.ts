import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { CarService } from '../car/car.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { T } from '../../libs/types/common';
import { lookupMember } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private memberService: MemberService,
		private carService: CarService,
		private boardArticleService: BoardArticleService,
		private notificationService: NotificationService,
		@InjectModel('Member') private readonly memberModel: Model<any>,
	) {}

	private async sendCommentNotification(
		authorId: string,
		receiverId: string,
		commentGroup: CommentGroup,
		commentContent: string,
		refId?: string,
	) {
		// Get the commenter's name
		const commenter = await this.memberModel.findById(authorId).exec();
		const commenterName = commenter ? commenter.memberNick : 'Someone';

		// Create notification description based on comment group
		let notificationDesc = '';

		switch (commentGroup) {
			case CommentGroup.CAR:
				// @ts-ignore
				const car = await this.carService.getCar(null, refId as any);
				notificationDesc = `${commenterName} commented on your car "${car.carTitle}"`;
				break;
			case CommentGroup.ARTICLE:
				// @ts-ignore
				const article = await this.boardArticleService.getBoardArticle(null, refId as any);
				notificationDesc = `${commenterName} commented on your article "${article.articleTitle}"`;
				break;
			case CommentGroup.MEMBER:
				notificationDesc = `${commenterName} commented on your profile`;
				break;
		}

		// Send notification
		await this.notificationService.createNotification({
			notificationType: NotificationType.COMMENT,
			notificationGroup: this.mapCommentGroupToNotificationGroup(commentGroup),
			notificationTitle: 'New Comment',
			notificationDesc,
			authorId,
			receiverId,
		});
	}

	private mapCommentGroupToNotificationGroup(commentGroup: CommentGroup): NotificationGroup {
		switch (commentGroup) {
			case CommentGroup.CAR:
				return NotificationGroup.CAR;
			case CommentGroup.ARTICLE:
				return NotificationGroup.ARTICLE;
			case CommentGroup.MEMBER:
				return NotificationGroup.MEMBER;
			default:
				return NotificationGroup.MEMBER;
		}
	}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;

		let result: Comment | null = null;
		try {
			result = await this.commentModel.create(input);

			// Get the owner ID of the commented item
			let ownerId: string | null = null;

			switch (input.commentGroup) {
				case CommentGroup.MEMBER:
					ownerId = input.commentRefId.toString();
					await this.memberService.memberStatsEditor({
						_id: input.commentRefId,
						targetKey: 'memberComments',
						modifier: 1,
					});
					break;
				case CommentGroup.CAR:
					// @ts-ignore
					const car = await this.carService.getCar(null, input.commentRefId);
					ownerId = car.memberId.toString();
					await this.carService.carStatsEditor({
						_id: input.commentRefId,
						targetKey: 'carComments',
						modifier: 1,
					});
					break;
				case CommentGroup.ARTICLE:
					// @ts-ignore
					const article = await this.boardArticleService.getBoardArticle(null, input.commentRefId);
					ownerId = article.memberId.toString();
					await this.boardArticleService.boardArticleStatsEditor({
						_id: input.commentRefId,
						targetKey: 'articleComments',
						modifier: 1,
					});
					break;
			}

			// Send notification if we have an owner ID and it's not a self-comment
			if (ownerId && ownerId !== memberId.toString()) {
				await this.sendCommentNotification(
					memberId.toString(),
					ownerId,
					input.commentGroup,
					input.commentContent,
					input.commentRefId.toString(),
				);
			}
		} catch (err) {
			console.log('Error, commentService:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		if (!result) throw new InternalServerErrorException(Message.CREATE_FAILED);
		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const result: Comment | null = await this.commentModel
			.findOneAndUpdate({ _id: input._id, memberId: memberId, commentStatus: CommentStatus.ACTIVE }, input, {
				new: true,
			})
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;

		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findOneAndDelete(input).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
