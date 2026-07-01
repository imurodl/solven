import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ViewService } from './view.service';
import { ViewGroup } from '../../libs/enums/view.enum';

const execWith = (value: any) => ({ exec: jest.fn().mockResolvedValue(value) });

describe('ViewService', () => {
	let service: ViewService;
	let viewModel: { findOne: jest.Mock; create: jest.Mock };

	beforeEach(async () => {
		viewModel = { findOne: jest.fn(), create: jest.fn() };
		const moduleRef = await Test.createTestingModule({
			providers: [ViewService, { provide: getModelToken('View'), useValue: viewModel }],
		}).compile();
		service = moduleRef.get<ViewService>(ViewService);
	});

	describe('recordView', () => {
		it('records a new view when none exists and returns the created document', async () => {
			viewModel.findOne.mockReturnValue(execWith(null));
			const created = { _id: 'view-1' };
			viewModel.create.mockResolvedValue(created);

			const input: any = { memberId: 'm1', viewRefId: 'car1', viewGroup: ViewGroup.CAR };
			const result = await service.recordView(input);

			expect(viewModel.findOne).toHaveBeenCalledWith({ memberId: 'm1', viewRefId: 'car1' });
			expect(viewModel.create).toHaveBeenCalledWith(input);
			expect(result).toBe(created);
		});

		it('does not double-count an existing view and returns null', async () => {
			viewModel.findOne.mockReturnValue(execWith({ _id: 'existing-view' }));

			const input: any = { memberId: 'm1', viewRefId: 'car1', viewGroup: ViewGroup.CAR };
			const result = await service.recordView(input);

			expect(result).toBeNull();
			expect(viewModel.create).not.toHaveBeenCalled();
		});
	});
});
