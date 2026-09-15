import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Message } from '../../libs/enums/common.enum';

// Fields that never belong in a browser-readable access token. The full profile
// is available to the owner via the `getMyProfile` query instead.
const PRIVATE_MEMBER_FIELDS = [
	'memberPassword',
	'refreshToken',
	'memberPhone',
	'memberEmail',
	'memberTelegramId',
	'memberGoogleId',
	'__v',
];

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword?: string): Promise<boolean> {
		return bcrypt.compare(password, hashedPassword);
	}

	private buildPayload(member: Member): Partial<Member> {
		const source: T = member['_doc'] ? member['_doc'] : member;
		const payload: Partial<Member> = {};
		Object.keys(source).forEach((key) => {
			if (PRIVATE_MEMBER_FIELDS.includes(key)) return;
			payload[key] = source[key];
		});
		return payload;
	}

	public async createToken(member: Member): Promise<string> {
		const payload = this.buildPayload(member);
		return await this.jwtService.signAsync(payload);
	}

	public async createRefreshToken(member: Member): Promise<string> {
		const payload = { _id: member._id, memberType: member.memberType, tokenType: 'refresh' };
		return await this.jwtService.signAsync(payload, {
			secret: process.env.REFRESH_SECRET || process.env.SECRET_TOKEN + '_refresh',
			expiresIn: '30d',
		});
	}

	public async verifyRefreshToken(token: string): Promise<T> {
		return await this.jwtService.verifyAsync(token, {
			secret: process.env.REFRESH_SECRET || process.env.SECRET_TOKEN + '_refresh',
		});
	}

	public async verifyToken(token: string): Promise<Member> {
		const member: Member = await this.jwtService.verifyAsync(token);
		// A refresh token must never be accepted as an access credential.
		if ((member as T).tokenType === 'refresh') throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}
}
