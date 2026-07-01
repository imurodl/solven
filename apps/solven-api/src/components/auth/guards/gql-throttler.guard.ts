import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

// Throttler is HTTP-context by default; GraphQL hides req/res inside the Gql context.
// This guard surfaces them so per-IP rate limiting works on GraphQL resolvers.
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
	getRequestResponse(context: ExecutionContext) {
		const gqlCtx = GqlExecutionContext.create(context);
		const ctx = gqlCtx.getContext();
		return { req: ctx.req, res: ctx.req?.res };
	}
}
