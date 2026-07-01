import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { MemberService } from '../member/member.service';
import { CarService } from '../car/car.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { NotificationService } from '../notification/notification.service';
import { CommentStatus } from '../../libs/enums/comment.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CommentService', () => {
	let service: CommentService;
	let commentModel: { findOneAndUpdate: jest.Mock; findByIdAndDelete: jest.Mock };

	beforeEach(async () => {
		commentModel = { findOneAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() };
		const moduleRef = await Test.createTestingModule({
			providers: [
				CommentService,
				{ provide: getModelToken('Comment'), useValue: commentModel },
				{ provide: MemberService, useValue: {} },
				{ provide: CarService, useValue: {} },
				{ provide: BoardArticleService, useValue: {} },
				{ provide: NotificationService, useValue: {} },
				{ provide: getModelToken('Member'), useValue: {} },
			],
		}).compile();
		service = moduleRef.get<CommentService>(CommentService);
	});

	describe('updateComment', () => {
		it('updates only the owner\'s active comment and returns the result', async () => {
			const updated = { _id: 'c1', commentContent: 'edited' };
			commentModel.findOneAndUpdate.mockReturnValue(execWith(updated));

			const input: any = { _id: 'c1', commentContent: 'edited' };
			const result = await service.updateComment('owner-1' as any, input);

			expect(result).toBe(updated);
			// ownership + ACTIVE status are part of the filter (can't edit others' or deleted comments)
			expect(commentModel.findOneAndUpdate).toHaveBeenCalledWith(
				{ _id: 'c1', memberId: 'owner-1', commentStatus: CommentStatus.ACTIVE },
				input,
				{ new: true },
			);
		});

		it('throws when no matching comment is found (wrong owner or already deleted)', async () => {
			commentModel.findOneAndUpdate.mockReturnValue(execWith(null));

			await expect(service.updateComment('owner-1' as any, { _id: 'c1' } as any)).rejects.toBeInstanceOf(
				InternalServerErrorException,
			);
		});
	});

	describe('removeCommentByAdmin', () => {
		it('hard-deletes the comment and returns it', async () => {
			const removed = { _id: 'c1' };
			commentModel.findByIdAndDelete.mockReturnValue(execWith(removed));

			const result = await service.removeCommentByAdmin('c1' as any);

			expect(commentModel.findByIdAndDelete).toHaveBeenCalledWith('c1');
			expect(result).toBe(removed);
		});

		it('throws when the comment to remove does not exist', async () => {
			commentModel.findByIdAndDelete.mockReturnValue(execWith(null));

			await expect(service.removeCommentByAdmin('missing' as any)).rejects.toBeInstanceOf(
				InternalServerErrorException,
			);
		});
	});
});
