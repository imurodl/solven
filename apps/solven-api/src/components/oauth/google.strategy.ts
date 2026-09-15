import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export const isGoogleConfigured = (): boolean =>
	!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);

export interface GoogleProfile {
	sub: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	picture?: string;
	memberId?: string;
}

// passport-google-oauth20 throws when clientID is missing, so placeholders keep
// boot working on servers without Google credentials; the controller refuses the
// route in that case (see isGoogleConfigured).
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor() {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
			callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3007/auth/google/callback',
			scope: ['email', 'profile'],
			passReqToCallback: true,
		});
	}

	async validate(
		req: any,
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback,
	): Promise<void> {
		const { name, emails, photos, id } = profile;
		const user: GoogleProfile = {
			sub: id,
			email: emails?.[0]?.value,
			firstName: name?.givenName,
			lastName: name?.familyName,
			picture: photos?.[0]?.value,
			// state carries the memberId when the flow is "link account"
			memberId: typeof req.query?.state === 'string' && req.query.state.length === 24 ? req.query.state : undefined,
		};
		done(null, user);
	}
}
