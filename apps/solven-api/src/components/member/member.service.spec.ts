import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MemberService } from './member.service';
import { AuthService } from '../auth/auth.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { MemberType } from '../../libs/enums/member.enum';

describe('MemberService.signup', () => {
	let service: MemberService;
	let memberModel: { create: jest.Mock; findByIdAndUpdate: jest.Mock };

	beforeEach(async () => {
		memberModel = {
			create: jest.fn(async (input: any) => ({ _id: 'member-1', ...input })),
			findByIdAndUpdate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({}) })),
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				MemberService,
				{ provide: getModelToken('Member'), useValue: memberModel },
				{ provide: getModelToken('Follow'), useValue: {} },
				{
					provide: AuthService,
					useValue: {
						hashPassword: jest.fn().mockResolvedValue('HASHED'),
						createToken: jest.fn().mockResolvedValue('ACCESS'),
						createRefreshToken: jest.fn().mockResolvedValue('REFRESH'),
					},
				},
				{ provide: ViewService, useValue: {} },
				{ provide: LikeService, useValue: {} },
			],
		}).compile();

		service = moduleRef.get<MemberService>(MemberService);
	});

	it('downgrades an ADMIN self-signup to USER (privilege-escalation guard)', async () => {
		await service.signup({
			memberNick: 'attacker',
			memberPassword: 'password',
			memberPhone: '01000000000',
			memberType: MemberType.ADMIN,
		} as any);

		expect(memberModel.create).toHaveBeenCalledWith(expect.objectContaining({ memberType: MemberType.USER }));
	});

	it('preserves an AGENT signup type', async () => {
		await service.signup({
			memberNick: 'dealer',
			memberPassword: 'password',
			memberPhone: '01000000001',
			memberType: MemberType.AGENT,
		} as any);

		expect(memberModel.create).toHaveBeenCalledWith(expect.objectContaining({ memberType: MemberType.AGENT }));
	});

	it('hashes the password before persisting', async () => {
		await service.signup({
			memberNick: 'user',
			memberPassword: 'plaintext',
			memberPhone: '01000000002',
			memberType: MemberType.USER,
		} as any);

		const created = memberModel.create.mock.calls[0][0];
		expect(created.memberPassword).toBe('HASHED');
		expect(created.memberPassword).not.toBe('plaintext');
	});
});
