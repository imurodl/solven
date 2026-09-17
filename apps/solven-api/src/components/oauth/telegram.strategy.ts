import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// Telegram login payloads are valid for 24h — old (captured) payloads are rejected.
const TELEGRAM_AUTH_TTL_SEC = 86400;

export interface TelegramAuthData {
	id: number | string;
	first_name?: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: number | string;
	hash: string;
}

@Injectable()
export class TelegramStrategy {
	public isConfigured(): boolean {
		return !!process.env.TELEGRAM_BOT_TOKEN;
	}

	// The numeric bot id is the public prefix of the token; the login widget's
	// popup API (Telegram.Login.auth) needs it instead of the bot username.
	public botId(botToken = process.env.TELEGRAM_BOT_TOKEN): string | undefined {
		const id = botToken?.split(':')[0];
		return id && /^\d+$/.test(id) ? id : undefined;
	}

	// Verifies the HMAC that the Telegram login widget signs with SHA256(botToken).
	public verify(data: TelegramAuthData, botToken = process.env.TELEGRAM_BOT_TOKEN, now = Date.now()): boolean {
		if (!botToken || !data || typeof data !== 'object') return false;
		const { hash, ...userData } = data as TelegramAuthData & Record<string, unknown>;
		if (!hash || typeof hash !== 'string') return false;

		const authDate = Number(userData.auth_date);
		if (!authDate || now / 1000 - authDate > TELEGRAM_AUTH_TTL_SEC) return false;

		const secretKey = crypto.createHash('sha256').update(botToken).digest();
		const checkString = Object.keys(userData)
			.filter((key) => userData[key] !== undefined && userData[key] !== null)
			.sort()
			.map((key) => `${key}=${userData[key]}`)
			.join('\n');
		const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

		const hmacBuf = Buffer.from(hmac, 'hex');
		const hashBuf = Buffer.from(hash, 'hex');
		if (hmacBuf.length !== hashBuf.length) return false;
		return crypto.timingSafeEqual(hmacBuf, hashBuf);
	}
}
