import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isGoogleConfigured } from './google.strategy';
import { getFrontendUrl } from '../../libs/config';
import { Message } from '../../libs/enums/common.enum';

// Runs before the passport guard so an unconfigured server never redirects the
// browser to Google with a placeholder client id.
@Injectable()
export class GoogleConfiguredGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		if (isGoogleConfigured()) return true;
		const res = context.switchToHttp().getResponse();
		res.redirect(`${getFrontendUrl()}/account/join?error=${encodeURIComponent(Message.OAUTH_NOT_CONFIGURED)}`);
		return false;
	}
}
