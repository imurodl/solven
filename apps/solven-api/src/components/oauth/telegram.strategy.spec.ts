import * as crypto from 'crypto';
import { TelegramStrategy } from './telegram.strategy';

const BOT = '123456:ABC-DEF';

const sign = (data: Record<string, unknown>, bot = BOT) => {
	const secret = crypto.createHash('sha256').update(bot).digest();
	const check = Object.keys(data)
		.sort()
		.map((k) => `${k}=${data[k]}`)
		.join('\n');
	return crypto.createHmac('sha256', secret).update(check).digest('hex');
};

describe('TelegramStrategy.verify', () => {
	const strategy = new TelegramStrategy();
	const now = 1_700_000_000_000;
	const base = { id: 42, first_name: 'Max', username: 'max', auth_date: Math.floor(now / 1000) - 60 };

	it('accepts a payload signed with the bot token', () => {
		expect(strategy.verify({ ...base, hash: sign(base) } as any, BOT, now)).toBe(true);
	});

	it('rejects a tampered payload', () => {
		expect(strategy.verify({ ...base, username: 'evil', hash: sign(base) } as any, BOT, now)).toBe(false);
	});

	it('rejects a payload signed for another bot', () => {
		expect(strategy.verify({ ...base, hash: sign(base, 'other') } as any, BOT, now)).toBe(false);
	});

	it('rejects stale payloads (replay)', () => {
		const old = { ...base, auth_date: Math.floor(now / 1000) - 90000 };
		expect(strategy.verify({ ...old, hash: sign(old) } as any, BOT, now)).toBe(false);
	});

	it('rejects when no bot token is configured or hash is malformed', () => {
		expect(strategy.verify({ ...base, hash: sign(base) } as any, undefined, now)).toBe(false);
		expect(strategy.verify({ ...base, hash: 'zz' } as any, BOT, now)).toBe(false);
	});
});
