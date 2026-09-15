import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { MemberAuthType, MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { GoogleProfile } from './google.strategy';
import { TelegramAuthData } from './telegram.strategy';
import { T } from '../../libs/types/common';

export interface TokenPair {
	token: string;
	refresh: string;
	member: Member;
}

@Injectable()
export class OAuthService {
	private readonly logger = new Logger(OAuthService.name);

	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
	) {}

	// Same access/refresh pair as password login: refresh hash stored on the member.
	public async issueTokenPair(member: Member): Promise<TokenPair> {
		if (member.memberStatus === MemberStatus.BLOCK) throw new ForbiddenException(Message.BLOCKED_USER);
		const token = await this.authService.createToken(member);
		const refresh = await this.authService.createRefreshToken(member);
		const hashedRefresh = await this.authService.hashPassword(refresh);
		await this.memberModel.findByIdAndUpdate(member._id, { refreshToken: hashedRefresh }).exec();
		return { token, refresh, member };
	}

	private async uniqueNick(base: string): Promise<string> {
		const clean =
			(base || 'user')
				.toLowerCase()
				.replace(/[^a-z0-9_]/g, '')
				.slice(0, 8) || 'user';
		for (let i = 0; i < 20; i++) {
			const candidate = i === 0 ? clean : `${clean}${Math.floor(Math.random() * 9000 + 1000)}`;
			if (candidate.length < 3) continue;
			const exists = await this.memberModel.exists({ memberNick: candidate });
			if (!exists) return candidate;
		}
		return `u${Date.now().toString(36)}`;
	}

	public async googleLogin(profile: GoogleProfile): Promise<TokenPair> {
		let member = await this.memberModel.findOne({ memberGoogleId: profile.sub }).exec();
		if (!member && profile.email) {
			// Same e-mail already registered (password or Telegram) — attach Google to it.
			member = await this.memberModel.findOne({ memberEmail: profile.email }).exec();
			if (member) await this.memberModel.findByIdAndUpdate(member._id, { memberGoogleId: profile.sub }).exec();
		}
		if (!member) {
			const nick = await this.uniqueNick(profile.email?.split('@')[0] || profile.firstName || 'user');
			member = await this.memberModel.create({
				memberNick: nick,
				memberFullName: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || undefined,
				memberEmail: profile.email,
				memberImage: profile.picture || '',
				memberAuthType: MemberAuthType.GOOGLE,
				memberType: MemberType.USER,
				memberGoogleId: profile.sub,
			});
			this.logger.log(`Google signup: ${nick}`);
		}
		return this.issueTokenPair(member as Member);
	}

	public async telegramLogin(data: TelegramAuthData): Promise<TokenPair> {
		const telegramId = String(data.id);
		let member = await this.memberModel.findOne({ memberTelegramId: telegramId }).exec();
		if (!member) {
			const nick = await this.uniqueNick(data.username || data.first_name || `tg${telegramId.slice(-4)}`);
			member = await this.memberModel.create({
				memberNick: nick,
				memberFullName: [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || undefined,
				memberImage: data.photo_url || '',
				memberAuthType: MemberAuthType.TELEGRAM,
				memberType: MemberType.USER,
				memberTelegramId: telegramId,
			});
			this.logger.log(`Telegram signup: ${nick}`);
		}
		return this.issueTokenPair(member as Member);
	}

	private async loadActive(memberId: string): Promise<Member> {
		const member = await this.memberModel.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE }).exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);
		return member as Member;
	}

	public async linkGoogle(memberId: string, profile: GoogleProfile): Promise<TokenPair> {
		const member = await this.loadActive(memberId);
		const other = await this.memberModel.findOne({ memberGoogleId: profile.sub, _id: { $ne: member._id } }).exec();
		if (other) throw new BadRequestException(Message.OAUTH_ACCOUNT_LINKED_ELSEWHERE);
		const patch: T = { memberGoogleId: profile.sub };
		if (!(member as T).memberEmail && profile.email) patch.memberEmail = profile.email;
		const updated = (await this.memberModel.findByIdAndUpdate(member._id, patch, { new: true }).exec()) as Member;
		return this.issueTokenPair(updated);
	}

	public async linkTelegram(memberId: string, data: TelegramAuthData): Promise<TokenPair> {
		const member = await this.loadActive(memberId);
		const telegramId = String(data.id);
		const other = await this.memberModel.findOne({ memberTelegramId: telegramId, _id: { $ne: member._id } }).exec();
		if (other) throw new BadRequestException(Message.OAUTH_ACCOUNT_LINKED_ELSEWHERE);
		const updated = (await this.memberModel
			.findByIdAndUpdate(member._id, { memberTelegramId: telegramId }, { new: true })
			.exec()) as Member;
		return this.issueTokenPair(updated);
	}

	public async unlink(memberId: string, provider: 'google' | 'telegram'): Promise<boolean> {
		const member = await this.memberModel
			.findById(memberId)
			.select('+memberPassword +memberGoogleId +memberTelegramId')
			.exec();
		if (!member) throw new BadRequestException(Message.NO_DATA_FOUND);
		const m = member as T;
		// Never strand an account with no way to log in.
		const remaining = [m.memberPassword, provider === 'google' ? m.memberTelegramId : m.memberGoogleId].filter(Boolean);
		if (!remaining.length) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		const field = provider === 'google' ? 'memberGoogleId' : 'memberTelegramId';
		await this.memberModel.findByIdAndUpdate(memberId, { $unset: { [field]: 1 } }).exec();
		return true;
	}
}
