import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CarService } from './car.service';
import { AuthService } from '../auth/auth.service';
import { ViewService } from '../view/view.service';
import { MemberService } from '../member/member.service';
import { LikeService } from '../like/like.service';
import { TranslationService } from '../translation/translation.service';
import { CarStatus } from '../../libs/enums/car.enum';
import { Direction } from '../../libs/enums/common.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });
const aggregateWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('CarService', () => {
	let service: CarService;
	let carModel: {
		aggregate: jest.Mock;
		findOne: jest.Mock;
		findByIdAndUpdate: jest.Mock;
	};
	let viewService: { recordView: jest.Mock };
	let memberService: { getMember: jest.Mock; memberStatsEditor: jest.Mock };
	let likeService: { checkLikeExistence: jest.Mock; toggleLike: jest.Mock };

	beforeEach(async () => {
		carModel = {
			aggregate: jest.fn(),
			findOne: jest.fn(),
			findByIdAndUpdate: jest.fn(),
		};
		viewService = { recordView: jest.fn() };
		memberService = { getMember: jest.fn(), memberStatsEditor: jest.fn() };
		likeService = { checkLikeExistence: jest.fn(), toggleLike: jest.fn() };

		const moduleRef = await Test.createTestingModule({
			providers: [
				CarService,
				{ provide: getModelToken('Car'), useValue: carModel },
				{ provide: AuthService, useValue: {} },
				{ provide: ViewService, useValue: viewService },
				{ provide: MemberService, useValue: memberService },
				{ provide: LikeService, useValue: likeService },
				{ provide: TranslationService, useValue: { translate: jest.fn().mockResolvedValue(null) } },
			],
		}).compile();

		service = moduleRef.get<CarService>(CarService);
	});

	describe('getCars', () => {
		const baseInput = (search: any = {}, extra: any = {}) => ({
			page: 1,
			limit: 10,
			search,
			...extra,
		});

		it('always constrains the match to ACTIVE cars and defaults sort to createdAt DESC', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([{ list: [], metaCounter: [] }]));

			await service.getCars(null as any, baseInput());

			const pipeline = carModel.aggregate.mock.calls[0][0];
			expect(pipeline[0].$match).toEqual({ carStatus: CarStatus.ACTIVE });
			expect(pipeline[1].$sort).toEqual({ createdAt: Direction.DESC });
		});

		it('honours an explicit sort field and direction', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([{ list: [], metaCounter: [] }]));

			await service.getCars(null as any, baseInput({}, { sort: 'carPrice', direction: Direction.ASC }));

			const pipeline = carModel.aggregate.mock.calls[0][0];
			expect(pipeline[1].$sort).toEqual({ carPrice: Direction.ASC });
		});

		it('builds range, list, text and option filters from the search fields', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([{ list: [], metaCounter: [] }]));

			await service.getCars(
				null as any,
				baseInput({
					memberId: '000000000000000000000001',
					locationList: ['SEOUL'],
					brandList: ['BMW'],
					modelList: ['X5'],
					typeList: ['SUV'],
					fuelTypeList: ['DIESEL'],
					transmissionList: ['AUTO'],
					colorList: ['BLACK'],
					pricesRange: { start: 1000, end: 5000 },
					mileageRange: { start: 0, end: 100000 },
					yearRange: { start: 2015, end: 2022 },
					text: 'clean',
					carListingOptions: ['carRent'],
					carOptions: ['carBarter'],
				}),
			);

			const match = carModel.aggregate.mock.calls[0][0][0].$match;
			expect(match.carStatus).toBe(CarStatus.ACTIVE);
			expect(String(match.memberId)).toBe('000000000000000000000001');
			expect(match.carLocation).toEqual({ $in: ['SEOUL'] });
			expect(match.carBrand).toEqual({ $in: ['BMW'] });
			expect(match.carModel).toEqual({ $in: ['X5'] });
			expect(match.carType).toEqual({ $in: ['SUV'] });
			expect(match.carFuelType).toEqual({ $in: ['DIESEL'] });
			expect(match.carTransmission).toEqual({ $in: ['AUTO'] });
			expect(match.carColor).toEqual({ $in: ['BLACK'] });
			expect(match.carPrice).toEqual({ $gte: 1000, $lte: 5000 });
			expect(match.carMileage).toEqual({ $gte: 0, $lte: 100000 });
			expect(match.manufacturedAt).toEqual({ $gte: 2015, $lte: 2022 });
			expect(match.carTitle).toBeInstanceOf(RegExp);
			expect(match.carOptions).toEqual({ $all: ['carRent'] });
			expect(match.$or).toEqual([{ carBarter: true }]);
		});

		it('paginates via $skip/$limit inside the list facet', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([{ list: [], metaCounter: [] }]));

			await service.getCars(null as any, baseInput({}, { page: 3, limit: 20 }));

			const facet = carModel.aggregate.mock.calls[0][0][2].$facet;
			expect(facet.list[0]).toEqual({ $skip: 40 });
			expect(facet.list[1]).toEqual({ $limit: 20 });
		});

		it('throws when the aggregation returns nothing', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([]));

			await expect(service.getCars(null as any, baseInput())).rejects.toBeInstanceOf(InternalServerErrorException);
		});
	});

	describe('getCar', () => {
		it('throws NO_DATA when the car is missing', async () => {
			carModel.findOne.mockReturnValue({ lean: () => execWith(null) });

			await expect(service.getCar(null as any, 'car-1' as any)).rejects.toBeInstanceOf(InternalServerErrorException);
		});

		it('does not record a view or check likes for an anonymous visitor', async () => {
			carModel.findOne.mockReturnValue({ lean: () => execWith({ _id: 'car-1', carViews: 4, memberId: 'owner-1' }) });
			memberService.getMember.mockResolvedValue({ _id: 'owner-1' });

			const result = await service.getCar(null as any, 'car-1' as any);

			expect(viewService.recordView).not.toHaveBeenCalled();
			expect(likeService.checkLikeExistence).not.toHaveBeenCalled();
			expect(result.carViews).toBe(4);
			expect(result.memberData).toEqual({ _id: 'owner-1' });
		});

		it('increments carViews when a member records a new view and resolves meLiked', async () => {
			carModel.findOne.mockReturnValue({ lean: () => execWith({ _id: 'car-1', carViews: 4, memberId: 'owner-1' }) });
			viewService.recordView.mockResolvedValue({ _id: 'view-1' });
			carModel.findByIdAndUpdate.mockReturnValue(execWith({}));
			likeService.checkLikeExistence.mockResolvedValue([{ myFavorite: true }]);
			memberService.getMember.mockResolvedValue({ _id: 'owner-1' });

			const result = await service.getCar('m1' as any, 'car-1' as any);

			expect(viewService.recordView).toHaveBeenCalled();
			expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith('car-1', { $inc: { carViews: 1 } }, { new: true });
			expect(result.carViews).toBe(5);
			expect(result.meLiked).toEqual([{ myFavorite: true }]);
		});

		it('does not increment carViews when the view is a repeat visit', async () => {
			carModel.findOne.mockReturnValue({ lean: () => execWith({ _id: 'car-1', carViews: 4, memberId: 'owner-1' }) });
			viewService.recordView.mockResolvedValue(null);
			likeService.checkLikeExistence.mockResolvedValue([]);
			memberService.getMember.mockResolvedValue({ _id: 'owner-1' });

			const result = await service.getCar('m1' as any, 'car-1' as any);

			expect(carModel.findByIdAndUpdate).not.toHaveBeenCalled();
			expect(result.carViews).toBe(4);
		});
	});

	describe('likeTargetCar', () => {
		it('toggles the like and applies the returned modifier to carLikes', async () => {
			carModel.findOne.mockReturnValue(execWith({ _id: 'car-1' }));
			likeService.toggleLike.mockResolvedValue(1);
			carModel.findByIdAndUpdate.mockReturnValue(execWith({ _id: 'car-1', carLikes: 6 }));

			const result = await service.likeTargetCar('m1' as any, 'car-1' as any);

			expect(carModel.findByIdAndUpdate).toHaveBeenCalledWith('car-1', { $inc: { carLikes: 1 } }, { new: true });
			expect(result.carLikes).toBe(6);
		});

		it('throws when the target car does not exist', async () => {
			carModel.findOne.mockReturnValue(execWith(null));

			await expect(service.likeTargetCar('m1' as any, 'missing' as any)).rejects.toBeInstanceOf(
				InternalServerErrorException,
			);
			expect(likeService.toggleLike).not.toHaveBeenCalled();
		});
	});

	describe('getAgentCars', () => {
		it('rejects a request for DELETE-status cars', async () => {
			await expect(
				service.getAgentCars('m1' as any, { page: 1, limit: 10, search: { carStatus: CarStatus.DELETE } } as any),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('defaults the match to exclude DELETE when no status is given', async () => {
			carModel.aggregate.mockReturnValue(aggregateWith([{ list: [], metaCounter: [] }]));

			await service.getAgentCars('m1' as any, { page: 1, limit: 10, search: {} } as any);

			const match = carModel.aggregate.mock.calls[0][0][0].$match;
			expect(match.memberId).toBe('m1');
			expect(match.carStatus).toEqual({ $ne: CarStatus.DELETE });
		});
	});
});
