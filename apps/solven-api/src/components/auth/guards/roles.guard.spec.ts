import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { AuthService } from '../auth.service';
import { MemberType } from 'apps/solven-api/src/libs/enums/member.enum';

type FakeReq = { headers: { authorization?: string }; body: Record<string, any> };

const makeContext = (opts: { contextType?: string; req?: FakeReq }) => {
	const { contextType = 'graphql', req } = opts;
	return {
		contextType,
		getHandler: () => () => undefined,
		getArgByIndex: (i: number) => (i === 2 ? { req } : undefined),
	} as any;
};

describe('RolesGuard', () => {
	let guard: RolesGuard;
	let reflector: { get: jest.Mock };
	let authService: { verifyToken: jest.Mock };

	const buildReq = (authorization?: string): FakeReq => ({
		headers: authorization ? { authorization } : {},
		body: {},
	});

	beforeEach(() => {
		reflector = { get: jest.fn() };
		authService = { verifyToken: jest.fn() };
		guard = new RolesGuard(reflector as unknown as Reflector, authService as unknown as AuthService);
	});

	it('allows the request through when no @Roles metadata is present', async () => {
		reflector.get.mockReturnValue(undefined);
		const ctx = makeContext({ req: buildReq('Bearer tok') });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(authService.verifyToken).not.toHaveBeenCalled();
	});

	it('returns false for non-graphql contexts', async () => {
		reflector.get.mockReturnValue([MemberType.ADMIN]);
		const ctx = makeContext({ contextType: 'http', req: buildReq('Bearer tok') });

		await expect(guard.canActivate(ctx)).resolves.toBe(false);
	});

	it('throws BadRequestException when the bearer token is missing', async () => {
		reflector.get.mockReturnValue([MemberType.ADMIN]);
		const ctx = makeContext({ req: buildReq(undefined) });

		await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
	});

	it('throws ForbiddenException when the member lacks the required role', async () => {
		reflector.get.mockReturnValue([MemberType.ADMIN]);
		authService.verifyToken.mockResolvedValue({ memberNick: 'joe', memberType: MemberType.USER });
		const ctx = makeContext({ req: buildReq('Bearer tok') });

		await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('allows the request and attaches authMember when the role matches', async () => {
		reflector.get.mockReturnValue([MemberType.ADMIN]);
		const authMember = { memberNick: 'boss', memberType: MemberType.ADMIN };
		authService.verifyToken.mockResolvedValue(authMember);
		const req = buildReq('Bearer tok');
		const ctx = makeContext({ req });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.body.authMember).toEqual(authMember);
		expect(authService.verifyToken).toHaveBeenCalledWith('tok');
	});
});
