import { ForbiddenException } from '@nestjs/common';
import { AiQuotaService } from './ai-quota.service';

describe('AiQuotaService', () => {
	const env = process.env;
	beforeEach(() => {
		process.env = { ...env, AI_DAILY_LIMIT_MEMBER: '2', AI_DAILY_LIMIT_ANON: '1' };
	});
	afterEach(() => {
		process.env = env;
	});

	it('allows the configured number of calls per member per day, then blocks', () => {
		const q = new AiQuotaService();
		q.consume('m1');
		q.consume('m1');
		expect(() => q.consume('m1')).toThrow(ForbiddenException);
		expect(q.remaining('m1')).toBe(0);
	});

	it('tracks anonymous callers by IP with a lower limit', () => {
		const q = new AiQuotaService();
		q.consume(undefined, '1.2.3.4');
		expect(() => q.consume(undefined, '1.2.3.4')).toThrow(ForbiddenException);
		expect(q.remaining(undefined, '5.6.7.8')).toBe(1);
	});

	it('resets after 24 hours', () => {
		const q = new AiQuotaService();
		const t0 = 1_000_000;
		q.consume('m1', undefined, t0);
		q.consume('m1', undefined, t0);
		expect(() => q.consume('m1', undefined, t0 + 1000)).toThrow();
		expect(() => q.consume('m1', undefined, t0 + 24 * 60 * 60 * 1000 + 1)).not.toThrow();
	});
});
