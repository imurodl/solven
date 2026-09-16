import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

// Throttler is HTTP-context by default; GraphQL hides req/res inside the Gql context.
// This guard surfaces them so per-IP rate limiting works on GraphQL resolvers, and
// still works for plain HTTP controllers (REST auth callbacks, /health) when used as
// the global APP_GUARD. WebSocket handlers have no req/res and are skipped.
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<GqlContextType>() === 'ws') return true;
		// The guard is registered globally (APP_GUARD) and again on handlers that
		// carry a @Throttle override, so one request was counted twice and every
		// limit was effectively halved. Count each request once per handler.
		const { req } = this.getRequestResponse(context);
		const handlerKey = `${context.getClass().name}.${context.getHandler().name}`;
		if (req) {
			const counted: Set<string> = (req.__throttleCounted ??= new Set());
			if (counted.has(handlerKey)) return true;
			counted.add(handlerKey);
		}
		return super.canActivate(context);
	}

	getRequestResponse(context: ExecutionContext) {
		if (context.getType<GqlContextType>() === 'graphql') {
			const ctx = GqlExecutionContext.create(context).getContext();
			return { req: ctx.req, res: ctx.req?.res ?? ctx.res };
		}
		const http = context.switchToHttp();
		return { req: http.getRequest(), res: http.getResponse() };
	}
}
