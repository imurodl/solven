import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReviewService } from './review.service';
import { NotificationService } from '../notification/notification.service';
import { ReviewReaction } from '../../libs/enums/review.enum';
import { Message } from '../../libs/enums/common.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });
const leanExec = (value: any) => ({ lean: () => execWith(value) });

const BUYER = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const SELLER = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CAR = 'cccccccccccccccccccccccc';
const ORDER = 'dddddddddddddddddddddddd';

describe('ReviewService', () => {
	let service: ReviewService;
	let reviewModel: any;
	let orderModel: any;
	let carModel: any;
	let memberModel: any;

	beforeEach(async () => {
		reviewModel = { findOne: jest.fn(), create: jest.fn(), aggregate: jest.fn(), findByIdAndUpdate: jest.fn() };
		orderModel = { findOne: jest.fn() };
		carModel = { findByIdAndUpdate: jest.fn().mockReturnValue(execWith({})) };
		memberModel = {
			findByIdAndUpdate: jest.fn().mockReturnValue(execWith({})),
			findById: jest.fn().mockReturnValue(leanExec({ memberNick: 'buyer' })),
		};
		const moduleRef = await Test.createTestingModule({
			providers: [
				ReviewService,
				{ provide: getModelToken('Review'), useValue: reviewModel },
				{ provide: getModelToken('Order'), useValue: orderModel },
				{ provide: getModelToken('Car'), useValue: carModel },
				{ provide: getModelToken('Member'), useValue: memberModel },
				{ provide: NotificationService, useValue: { createNotification: jest.fn().mockResolvedValue({}) } },
			],
		}).compile();
		service = moduleRef.get(ReviewService);
	});

	const input = () => ({ carId: CAR as any, orderId: ORDER as any, reviewRating: 5, reviewContent: 'Great' });

	it('rejects a review without a completed order for that car', async () => {
		orderModel.findOne.mockReturnValue(execWith(null));
		await expect(service.createReview(BUYER as any, input())).rejects.toThrow(Message.REVIEW_REQUIRES_COMPLETED_ORDER);
		expect(orderModel.findOne.mock.calls[0][0]).toMatchObject({
			memberId: BUYER,
			carId: CAR,
			orderStatus: 'COMPLETED',
		});
	});

	it('rejects a duplicate review for the same deal', async () => {
		orderModel.findOne.mockReturnValue(execWith({ sellerId: SELLER, carSnapshot: {} }));
		reviewModel.findOne.mockReturnValue(execWith({ _id: 'x' }));
		await expect(service.createReview(BUYER as any, input())).rejects.toThrow(Message.REVIEW_ALREADY_EXISTS);
	});

	it('creates the review with the seller id and recomputes car + seller ratings', async () => {
		orderModel.findOne.mockReturnValue(execWith({ _id: ORDER, sellerId: SELLER, carSnapshot: { carTitle: 'Sonata' } }));
		reviewModel.findOne.mockReturnValue(execWith(null));
		reviewModel.create.mockResolvedValue({ _id: 'r1' });
		reviewModel.aggregate.mockReturnValue(execWith([{ avg: 4.333, count: 3 }]));

		await service.createReview(BUYER as any, input());

		expect(reviewModel.create).toHaveBeenCalledWith(expect.objectContaining({ memberId: BUYER, sellerId: SELLER }));
		expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith(CAR, { carRating: 4.3, carReviews: 3 });
		expect(memberModel.findByIdAndUpdate).toHaveBeenCalledWith(SELLER, { memberRating: 4.3, memberReviews: 3 });
	});

	describe('toggleReviewReaction', () => {
		const doc = (likes: string[] = [], dislikes: string[] = []) => ({
			get: (k: string) => (k === 'reviewLikes' ? likes : dislikes),
		});

		it('adds a like, and a later dislike replaces it', async () => {
			reviewModel.findOne.mockReturnValue(execWith(doc()));
			reviewModel.findByIdAndUpdate.mockReturnValue(execWith({}));
			const liked = await service.toggleReviewReaction(BUYER as any, 'r1' as any, ReviewReaction.LIKE);
			expect(liked).toMatchObject({ likesCount: 1, dislikesCount: 0, myReaction: ReviewReaction.LIKE });

			reviewModel.findOne.mockReturnValue(execWith(doc([BUYER], [])));
			const disliked = await service.toggleReviewReaction(BUYER as any, 'r1' as any, ReviewReaction.DISLIKE);
			expect(disliked).toMatchObject({ likesCount: 0, dislikesCount: 1, myReaction: ReviewReaction.DISLIKE });
		});

		it('toggling the same reaction removes it', async () => {
			reviewModel.findOne.mockReturnValue(execWith(doc([BUYER], [])));
			reviewModel.findByIdAndUpdate.mockReturnValue(execWith({}));
			const res = await service.toggleReviewReaction(BUYER as any, 'r1' as any, ReviewReaction.LIKE);
			expect(res).toMatchObject({ likesCount: 0, dislikesCount: 0 });
			expect(res.myReaction).toBeUndefined();
		});
	});

	it('summarises ratings with a full 5..1 distribution', async () => {
		reviewModel.aggregate.mockReturnValue(
			execWith([{ averageRating: 4.25, totalReviews: 4, r1: 0, r2: 0, r3: 1, r4: 1, r5: 2 }]),
		);
		const summary = await service.getReviewSummary({ carId: CAR as any });
		expect(summary.averageRating).toBe(4.3);
		expect(summary.ratingDistribution.map((r) => r.count)).toEqual([2, 1, 1, 0, 0]);
	});

	it('returns an empty summary when there are no reviews', async () => {
		reviewModel.aggregate.mockReturnValue(execWith([]));
		expect(await service.getReviewSummary({ carId: CAR as any })).toEqual({
			averageRating: 0,
			totalReviews: 0,
			ratingDistribution: [],
		});
	});
});
