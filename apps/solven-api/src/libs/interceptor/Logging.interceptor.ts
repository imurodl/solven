import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'http') {
			/* develop if needed! */
		} else if (requestType === 'graphql') {
			/* (1) print request */
			const gqlContext = GqlExecutionContext.create(context);
			const body = this.redact(gqlContext.getContext().req.body);
			this.logger.log(`${this.stringify(body)}`, 'REQUEST');

			/* (2) error handling via graphql */
			/* (3) no error => giving response below */
			return next.handle().pipe(
				tap((context) => {
					const responseTime = Date.now() - recordTime;
					this.logger.log(`${this.stringify(this.redact(context))} ${responseTime}ms \n \n`, 'RESPONSE');
				}),
			);
		}
		return next.handle();
	}

	private stringify(context: ExecutionContext): string {
		return JSON.stringify(context).slice(0, 75);
	}

	// Deep-copy the payload with any password-bearing key masked so credentials
	// never reach stdout (login/signup mutations carry memberPassword in the body).
	// Mongoose documents are unwrapped with toObject() and the walk is bounded
	// (depth + seen-set) so circular internals can never overflow the stack.
	private redact(value: any, depth = 0, seen: WeakSet<object> = new WeakSet()): any {
		if (value instanceof Date) return value;
		if (Array.isArray(value)) return depth > 6 ? '[...]' : value.map((item) => this.redact(item, depth + 1, seen));
		if (value && typeof value === 'object') {
			if (typeof value.toObject === 'function') value = value.toObject();
			if (seen.has(value)) return '[Circular]';
			if (depth > 6) return '[...]';
			seen.add(value);
			const result: any = {};
			for (const key of Object.keys(value)) {
				result[key] = /password/i.test(key) ? '[REDACTED]' : this.redact(value[key], depth + 1, seen);
			}
			return result;
		}
		return value;
	}
}
