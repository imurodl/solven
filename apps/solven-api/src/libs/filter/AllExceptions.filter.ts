import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlContextType } from '@nestjs/graphql';

// Catch-all so that unexpected errors (Mongo, fetch, bugs) are logged with a
// stack instead of vanishing, while intentional HttpExceptions keep their
// message. GraphQL requests are re-thrown so Apollo's formatError shapes them;
// plain HTTP (REST auth controller, health) gets a JSON body.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const isHttp = exception instanceof HttpException;
		if (!isHttp) {
			const err = exception as Error;
			this.logger.error(`Unhandled: ${err?.message ?? exception}`, err?.stack);
		}

		if (host.getType<GqlContextType>() === 'graphql') {
			GqlArgumentsHost.create(host);
			throw exception;
		}

		const ctx = host.switchToHttp();
		const res = ctx.getResponse();
		// A guard may already have redirected (e.g. unconfigured OAuth provider).
		if (res?.headersSent) return;
		const status = isHttp ? (exception as HttpException).getStatus() : 500;
		const body = isHttp
			? (exception as HttpException).getResponse()
			: { statusCode: 500, message: 'Internal server error' };
		if (typeof res?.status === 'function') {
			res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
		}
	}
}
