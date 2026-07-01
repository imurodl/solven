import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { LikeService } from './like.service';
import { NotificationService } from '../notification/notification.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationGroup } from '../../libs/enums/notification.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('LikeService', () => {
	let service: LikeService;
	let likeModel: { findOne: jest.Mock; findOneAndDelete: jest.Mock; create: jest.Mock };
	let notificationService: { createNotification: jest.Mock };
	let carModel: { findById: jest.Mock };
	let boardArticleModel: { findById: jest.Mock };
	let memberModel: { findById: jest.Mock };

	beforeEach(async () => {
		likeModel = { findOne: jest.fn(), findOneAndDelete: jest.fn(), create: jest.fn() };
		notificationService = { createNotification: jest.fn().mockResolvedValue(undefined) };
		carModel = { findById: jest.fn() };
		boardArticleModel = { findById: jest.fn() };
		memberModel = { findById: jest.fn() };

		const moduleRef = await Test.createTestingModule({
			providers: [
				LikeService,
				{ provide: getModelToken('Like'), useValue: likeModel },
				{ provide: NotificationService, useValue: notificationService },
				{ provide: getModelToken('Car'), useValue: carModel },
				{ provide: getModelToken('BoardArticle'), useValue: boardArticleModel },
				{ provide: getModelToken('Member'), useValue: memberModel },
			],
		}).compile();

		service = moduleRef.get<LikeService>(LikeService);
	});

	describe('toggleLike', () => {
		it('removes an existing like and returns -1 without sending a notification', async () => {
			likeModel.findOne.mockReturnValue(execWith({ _id: 'like-1' }));
			likeModel.findOneAndDelete.mockReturnValue(execWith({}));

			const input: any = { memberId: 'm1', likeRefId: 'ref1', likeGroup: LikeGroup.CAR };
			const result = await service.toggleLike(input);

			expect(result).toBe(-1);
			expect(likeModel.findOneAndDelete).toHaveBeenCalledWith(input);
			expect(likeModel.create).not.toHaveBeenCalled();
			expect(notificationService.createNotification).not.toHaveBeenCalled();
		});

		it('creates a like on a car and notifies the car owner, returning 1', async () => {
			likeModel.findOne.mockReturnValue(execWith(null));
			likeModel.create.mockResolvedValue({});
			memberModel.findById.mockReturnValue(execWith({ memberNick: 'liker-nick' }));
			carModel.findById.mockReturnValue(execWith({ memberId: 'owner-id', carTitle: 'My Car' }));

			const input: any = { memberId: 'm1', likeRefId: 'car1', likeGroup: LikeGroup.CAR };
			const result = await service.toggleLike(input);

			expect(result).toBe(1);
			expect(likeModel.create).toHaveBeenCalledWith(input);
			expect(notificationService.createNotification).toHaveBeenCalledWith(
				expect.objectContaining({
					notificationGroup: NotificationGroup.CAR,
					receiverId: 'owner-id',
					notificationDesc: 'liker-nick liked your car "My Car"',
					authorId: 'm1',
				}),
			);
		});

		it('creates a like on a member and notifies that member', async () => {
			likeModel.findOne.mockReturnValue(execWith(null));
			likeModel.create.mockResolvedValue({});
			memberModel.findById.mockReturnValue(execWith({ memberNick: 'liker-nick' }));

			const input: any = { memberId: 'm1', likeRefId: 'target-member', likeGroup: LikeGroup.MEMBER };
			const result = await service.toggleLike(input);

			expect(result).toBe(1);
			expect(notificationService.createNotification).toHaveBeenCalledWith(
				expect.objectContaining({
					notificationGroup: NotificationGroup.MEMBER,
					receiverId: 'target-member',
					notificationDesc: 'liker-nick liked your profile',
				}),
			);
		});

		it('throws BadRequestException when creating the like fails', async () => {
			likeModel.findOne.mockReturnValue(execWith(null));
			likeModel.create.mockRejectedValue(new Error('db down'));

			const input: any = { memberId: 'm1', likeRefId: 'car1', likeGroup: LikeGroup.CAR };
			await expect(service.toggleLike(input)).rejects.toBeInstanceOf(BadRequestException);
		});
	});

	describe('checkLikeExistence', () => {
		it('returns a favorite marker when a like exists', async () => {
			likeModel.findOne.mockReturnValue(execWith({ _id: 'like-1' }));

			const result = await service.checkLikeExistence({ memberId: 'm1', likeRefId: 'ref1' } as any);

			expect(result).toEqual([{ memberId: 'm1', likeRefId: 'ref1', myFavorite: true }]);
		});

		it('returns an empty array when no like exists', async () => {
			likeModel.findOne.mockReturnValue(execWith(null));

			const result = await service.checkLikeExistence({ memberId: 'm1', likeRefId: 'ref1' } as any);

			expect(result).toEqual([]);
		});
	});
});
