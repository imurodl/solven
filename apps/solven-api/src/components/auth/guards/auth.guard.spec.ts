import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../auth.service';

type FakeReq = { headers: { authorization?: string }; body: Record<string, any> };

const makeContext = (opts: { contextType?: string; req?: FakeReq }) => {
	const { contextType = 'graphql', req } = opts;
	return {
		contextType,
		getArgByIndex: (i: number) => (i === 2 ? { req } : undefined),
	} as any;
};

describe('AuthGuard', () => {
	let guard: AuthGuard;
	let authService: { verifyToken: jest.Mock };

	const buildReq = (authorization?: string): FakeReq => ({
		headers: authorization ? { authorization } : {},
		body: {},
	});

	beforeEach(() => {
		authService = { verifyToken: jest.fn() };
		guard = new AuthGuard(authService as unknown as AuthService);
	});

	it('returns false for non-graphql contexts', async () => {
		const ctx = makeContext({ contextType: 'http', req: buildReq('Bearer tok') });

		await expect(guard.canActivate(ctx)).resolves.toBe(false);
		expect(authService.verifyToken).not.toHaveBeenCalled();
	});

	it('throws BadRequestException when the bearer token is missing', async () => {
		const ctx = makeContext({ req: buildReq(undefined) });

		await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(BadRequestException);
	});

	it('throws UnauthorizedException when the token does not resolve to a member', async () => {
		authService.verifyToken.mockResolvedValue(null);
		const ctx = makeContext({ req: buildReq('Bearer bad') });

		await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
		expect(authService.verifyToken).toHaveBeenCalledWith('bad');
	});

	it('allows the request and attaches authMember for a valid token', async () => {
		const authMember = { memberNick: 'max' };
		authService.verifyToken.mockResolvedValue(authMember);
		const req = buildReq('Bearer good');
		const ctx = makeContext({ req });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.body.authMember).toEqual(authMember);
	});
});
