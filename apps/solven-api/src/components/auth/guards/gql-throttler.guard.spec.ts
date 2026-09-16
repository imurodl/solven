import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './gql-throttler.guard';

class Handler {
	signup() {}
}

const httpContext = (req: Record<string, any>): ExecutionContext =>
	({
		getType: () => 'http',
		getHandler: () => Handler.prototype.signup,
		getClass: () => Handler,
		switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({ header: jest.fn() }) }),
	}) as unknown as ExecutionContext;

describe('GqlThrottlerGuard', () => {
	let guard: GqlThrottlerGuard;

	beforeEach(async () => {
		guard = new GqlThrottlerGuard(
			{ throttlers: [{ name: 'default', limit: 3, ttl: 60000 }] },
			new ThrottlerStorageService(),
			new Reflector(),
		);
		await guard.onModuleInit();
	});

	it('counts a request once even when the guard runs twice for the same handler', async () => {
		const req = { ip: '10.0.0.1', headers: {} };
		for (let i = 0; i < 6; i++) await expect(guard.canActivate(httpContext(req))).resolves.toBe(true);
	});

	it('still enforces the limit across distinct requests from one client', async () => {
		const mk = () => ({ ip: '10.0.0.2', headers: {} });
		await expect(guard.canActivate(httpContext(mk()))).resolves.toBe(true);
		await expect(guard.canActivate(httpContext(mk()))).resolves.toBe(true);
		await expect(guard.canActivate(httpContext(mk()))).resolves.toBe(true);
		await expect(guard.canActivate(httpContext(mk()))).rejects.toThrow(/Too Many Requests/);
	});

	it('skips websocket contexts', async () => {
		const ctx = { getType: () => 'ws' } as unknown as ExecutionContext;
		await expect(guard.canActivate(ctx)).resolves.toBe(true);
	});
});
