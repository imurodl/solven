import { Body, Controller, Get, Logger, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { OAuthService, TokenPair } from './oauth.service';
import { TelegramStrategy } from './telegram.strategy';
import { isGoogleConfigured } from './google.strategy';
import { getApiPublicUrl, getFrontendUrl } from '../../libs/config';
import { GoogleConfiguredGuard } from './google-configured.guard';
import { Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';

// REST endpoints for browser-redirect OAuth flows. Results are handed to the
// SPA as query params (?token=&refresh= or ?error=) which _app.tsx consumes once.
@Controller('auth')
export class OAuthController {
	private readonly logger = new Logger(OAuthController.name);

	constructor(
		private readonly oauthService: OAuthService,
		private readonly telegramStrategy: TelegramStrategy,
		private readonly authService: AuthService,
	) {}

	private redirect(res: any, path: string, params: Record<string, string>): void {
		const qs = new URLSearchParams(params).toString();
		res.redirect(`${getFrontendUrl()}${path}?${qs}`);
	}

	private setCookie(res: any, name: string, value: string, maxAgeMs: number): void {
		res.cookie(name, value, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: maxAgeMs,
		});
	}

	private parseCookies(req: any): Record<string, string> {
		return Object.fromEntries(
			String(req.headers?.cookie || '')
				.split(';')
				.map((c: string) => c.trim().split('='))
				.filter(([k]: string[]) => k)
				.map(([k, v]: string[]) => [k, decodeURIComponent(v ?? '')]),
		);
	}

	// Bearer token from the SPA for link/unlink actions (REST, not GraphQL).
	private async memberIdFromBearer(req: any): Promise<string | null> {
		const auth = req.headers?.authorization;
		if (!auth?.startsWith('Bearer ')) return null;
		try {
			const member = await this.authService.verifyToken(auth.slice(7));
			return String(member._id);
		} catch {
			return null;
		}
	}

	@Get('providers')
	providers(): { google: boolean; telegram: boolean; telegramBot?: string } {
		return {
			google: isGoogleConfigured(),
			telegram: this.telegramStrategy.isConfigured(),
			telegramBot: process.env.TELEGRAM_BOT_NAME || undefined,
		};
	}

	/** GOOGLE **/
	// GoogleConfiguredGuard bounces to the SPA with an error when credentials are
	// missing; otherwise passport redirects the browser to Google. `state` carries
	// the memberId during account linking.
	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@Get('google')
	@UseGuards(GoogleConfiguredGuard, PassportAuthGuard('google'))
	googleAuth(): void {
		// passport redirects to Google
	}

	@Get('google/callback')
	@UseGuards(PassportAuthGuard('google'))
	async googleCallback(@Req() req: any, @Res() res: any): Promise<void> {
		const cookies = this.parseCookies(req);
		const linkMemberId = cookies.linkMemberId || req.user?.memberId;
		try {
			let result: TokenPair;
			let path = '/';
			if (linkMemberId) {
				result = await this.oauthService.linkGoogle(linkMemberId, req.user);
				res.cookie('linkMemberId', '', { maxAge: 0 });
				path = '/mypage';
			} else {
				result = await this.oauthService.googleLogin(req.user);
			}
			this.redirect(res, path, { token: result.token, refresh: result.refresh });
		} catch (err: any) {
			this.logger.warn(`Google callback failed: ${err?.message}`);
			this.redirect(res, linkMemberId ? '/mypage' : '/account/join', {
				error: err?.message || Message.SOMETHING_WENT_WRONG,
			});
		}
	}

	// Account linking: remember who is linking (httpOnly cookie, 5 min) then run the
	// normal Google flow. The callback sees the cookie and links instead of logging in.
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Get('link/google')
	async linkGoogle(@Req() req: any, @Res() res: any, @Query('token') token?: string): Promise<void> {
		if (!isGoogleConfigured()) return this.redirect(res, '/mypage', { error: Message.OAUTH_NOT_CONFIGURED });
		let memberId: string | null = null;
		if (token) {
			try {
				memberId = String((await this.authService.verifyToken(token))._id);
			} catch {
				memberId = null;
			}
		}
		if (!memberId) return this.redirect(res, '/mypage', { error: Message.NOT_AUTHENTICATED });
		this.setCookie(res, 'linkMemberId', memberId, 5 * 60 * 1000);
		res.redirect(`${getApiPublicUrl()}/auth/google?state=${memberId}`);
	}

	/** TELEGRAM **/
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Post('telegram')
	async telegram(@Body() body: any, @Res() res: any): Promise<void> {
		if (!this.telegramStrategy.isConfigured()) return res.status(503).json({ message: Message.OAUTH_NOT_CONFIGURED });
		if (!this.telegramStrategy.verify(body)) return res.status(401).json({ message: Message.INVALID_OAUTH_DATA });
		try {
			const result = await this.oauthService.telegramLogin(body);
			return res.json({ token: result.token, refresh: result.refresh });
		} catch (err: any) {
			return res.status(400).json({ message: err?.message || Message.SOMETHING_WENT_WRONG });
		}
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Post('link/telegram')
	async linkTelegram(@Req() req: any, @Body() body: any, @Res() res: any): Promise<void> {
		if (!this.telegramStrategy.isConfigured()) return res.status(503).json({ message: Message.OAUTH_NOT_CONFIGURED });
		const memberId = await this.memberIdFromBearer(req);
		if (!memberId) return res.status(401).json({ message: Message.NOT_AUTHENTICATED });
		if (!this.telegramStrategy.verify(body)) return res.status(401).json({ message: Message.INVALID_OAUTH_DATA });
		try {
			const result = await this.oauthService.linkTelegram(memberId, body);
			return res.json({ token: result.token, refresh: result.refresh });
		} catch (err: any) {
			return res.status(400).json({ message: err?.message || Message.SOMETHING_WENT_WRONG });
		}
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@Post('unlink/:provider')
	async unlink(@Req() req: any, @Res() res: any): Promise<void> {
		const provider = req.params?.provider;
		if (provider !== 'google' && provider !== 'telegram') return res.status(400).json({ message: Message.BAD_REQUEST });
		const memberId = await this.memberIdFromBearer(req);
		if (!memberId) return res.status(401).json({ message: Message.NOT_AUTHENTICATED });
		try {
			await this.oauthService.unlink(memberId, provider);
			return res.json({ success: true });
		} catch (err: any) {
			return res.status(400).json({ message: err?.message || Message.SOMETHING_WENT_WRONG });
		}
	}
}
