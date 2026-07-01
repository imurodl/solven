import { WithoutGuard } from './without.guard';
import { AuthService } from '../auth.service';

type FakeReq = { headers: { authorization?: string }; body: Record<string, any> };

const makeContext = (opts: { contextType?: string; req?: FakeReq }) => {
	const { contextType = 'graphql', req } = opts;
	return {
		contextType,
		getArgByIndex: (i: number) => (i === 2 ? { req } : undefined),
	} as any;
};

describe('WithoutGuard', () => {
	let guard: WithoutGuard;
	let authService: { verifyToken: jest.Mock };

	const buildReq = (authorization?: string): FakeReq => ({
		headers: authorization ? { authorization } : {},
		body: {},
	});

	beforeEach(() => {
		authService = { verifyToken: jest.fn() };
		guard = new WithoutGuard(authService as unknown as AuthService);
	});

	it('returns false for non-graphql contexts', async () => {
		const ctx = makeContext({ contextType: 'http', req: buildReq('Bearer tok') });

		await expect(guard.canActivate(ctx)).resolves.toBe(false);
	});

	it('sets authMember to null and passes when no token is present', async () => {
		const req = buildReq(undefined);
		const ctx = makeContext({ req });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.body.authMember).toBeNull();
		expect(authService.verifyToken).not.toHaveBeenCalled();
	});

	it('attaches authMember when the token is valid', async () => {
		const authMember = { memberNick: 'max' };
		authService.verifyToken.mockResolvedValue(authMember);
		const req = buildReq('Bearer good');
		const ctx = makeContext({ req });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.body.authMember).toEqual(authMember);
	});

	it('swallows verification errors, sets authMember to null, and still passes', async () => {
		authService.verifyToken.mockRejectedValue(new Error('bad token'));
		const req = buildReq('Bearer expired');
		const ctx = makeContext({ req });

		await expect(guard.canActivate(ctx)).resolves.toBe(true);
		expect(req.body.authMember).toBeNull();
	});
});
