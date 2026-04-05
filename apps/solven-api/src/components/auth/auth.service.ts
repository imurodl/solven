import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import * as crypto from 'crypto';

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

	private buildPayload(member: Member): T {
		const payload: T = {};
		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});
		delete payload.memberPassword;
		delete payload.refreshToken;
		return payload;
	}

	public async createToken(member: Member): Promise<string> {
		const payload = this.buildPayload(member);
		return await this.jwtService.signAsync(payload);
	}

	public async createRefreshToken(member: Member): Promise<string> {
		const payload = { _id: member._id, memberType: member.memberType };
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
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}
}
