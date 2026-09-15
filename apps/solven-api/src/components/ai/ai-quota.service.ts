import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Message } from '../../libs/enums/common.enum';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MEMBER_DAILY_LIMIT = 10;
const DEFAULT_ANON_DAILY_LIMIT = 3;
const CLEANUP_EVERY = 500;

interface QuotaEntry {
	count: number;
	resetAt: number;
}

// Daily cap on paid AI calls per member (or per IP for anonymous visitors).
// In-memory: resets on restart, single-instance only — fine for this deployment.
@Injectable()
export class AiQuotaService {
	private readonly logger = new Logger(AiQuotaService.name);
	private readonly entries = new Map<string, QuotaEntry>();
	private checkCount = 0;

	private get memberLimit(): number {
		return Number(process.env.AI_DAILY_LIMIT_MEMBER) || DEFAULT_MEMBER_DAILY_LIMIT;
	}

	private get anonLimit(): number {
		return Number(process.env.AI_DAILY_LIMIT_ANON) || DEFAULT_ANON_DAILY_LIMIT;
	}

	public consume(memberId?: string, ip?: string, now = Date.now()): void {
		const key = memberId ? `member:${memberId}` : `ip:${ip || 'unknown'}`;
		const limit = memberId ? this.memberLimit : this.anonLimit;

		if (++this.checkCount % CLEANUP_EVERY === 0) this.cleanup(now);

		const entry = this.entries.get(key);
		if (!entry || entry.resetAt <= now) {
			this.entries.set(key, { count: 1, resetAt: now + DAY_MS });
			return;
		}
		if (entry.count >= limit) {
			this.logger.warn(`AI daily limit reached: ${key} (${entry.count}/${limit})`);
			throw new ForbiddenException(Message.DAILY_AI_LIMIT_REACHED);
		}
		entry.count += 1;
	}

	public remaining(memberId?: string, ip?: string, now = Date.now()): number {
		const key = memberId ? `member:${memberId}` : `ip:${ip || 'unknown'}`;
		const limit = memberId ? this.memberLimit : this.anonLimit;
		const entry = this.entries.get(key);
		if (!entry || entry.resetAt <= now) return limit;
		return Math.max(0, limit - entry.count);
	}

	private cleanup(now: number): void {
		for (const [key, entry] of this.entries) if (entry.resetAt <= now) this.entries.delete(key);
	}
}
