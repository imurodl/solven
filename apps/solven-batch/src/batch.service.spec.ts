import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BatchService } from './batch.service';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('BatchService', () => {
	let service: BatchService;
	let carModel: { find: jest.Mock; bulkWrite: jest.Mock };
	let memberModel: { find: jest.Mock; bulkWrite: jest.Mock };

	beforeEach(async () => {
		carModel = { find: jest.fn(), bulkWrite: jest.fn().mockResolvedValue({}) };
		memberModel = { find: jest.fn(), bulkWrite: jest.fn().mockResolvedValue({}) };

		const moduleRef = await Test.createTestingModule({
			providers: [
				BatchService,
				{ provide: getModelToken('Car'), useValue: carModel },
				{ provide: getModelToken('Member'), useValue: memberModel },
				{
					provide: getModelToken('ServiceJob'),
					useValue: {
						updateMany: jest.fn().mockReturnValue({ exec: jest.fn() }),
						find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
						bulkWrite: jest.fn(),
					},
				},
			],
		}).compile();

		service = moduleRef.get<BatchService>(BatchService);
	});

	describe('batchTopCars', () => {
		it('ranks active cars in a single bulkWrite (likes*2 + views*1)', async () => {
			carModel.find.mockReturnValue(
				execWith([
					{ _id: 'c1', carLikes: 3, carViews: 4 },
					{ _id: 'c2', carLikes: 0, carViews: 10 },
				]),
			);

			await service.batchTopCars();

			expect(carModel.bulkWrite).toHaveBeenCalledTimes(1);
			expect(carModel.bulkWrite).toHaveBeenCalledWith([
				{ updateOne: { filter: { _id: 'c1' }, update: { $set: { carRank: 10 } } } },
				{ updateOne: { filter: { _id: 'c2' }, update: { $set: { carRank: 10 } } } },
			]);
		});

		it('skips bulkWrite when there are no cars to rank', async () => {
			carModel.find.mockReturnValue(execWith([]));

			await service.batchTopCars();

			expect(carModel.bulkWrite).not.toHaveBeenCalled();
		});
	});

	describe('batchTopAgents', () => {
		it('ranks agents in a single bulkWrite (cars*5 + articles*3 + likes*2 + views*1)', async () => {
			memberModel.find.mockReturnValue(
				execWith([{ _id: 'a1', memberCars: 2, memberArticles: 1, memberLikes: 4, memberViews: 5 }]),
			);

			await service.batchTopAgents();

			expect(memberModel.bulkWrite).toHaveBeenCalledTimes(1);
			expect(memberModel.bulkWrite).toHaveBeenCalledWith([
				{ updateOne: { filter: { _id: 'a1' }, update: { $set: { memberRank: 26 } } } },
			]);
		});
	});
});
