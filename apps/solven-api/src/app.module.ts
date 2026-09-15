import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './components/auth/guards/gql-throttler.guard';
import * as depthLimit from 'graphql-depth-limit';
import * as Joi from 'joi';

// Fail fast at boot when critical secrets are missing (a blank SECRET_TOKEN
// silently signs JWTs with the string "undefined").
const graphqlLogger = new Logger('GraphQL');

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
				SECRET_TOKEN: Joi.string().required(),
				// Optional by design: REFRESH_SECRET falls back to SECRET_TOKEN+'_refresh',
				// and MONGO_DEV is unset in prod (which selects MONGO_PROD via NODE_ENV).
				REFRESH_SECRET: Joi.string().optional(),
				MONGO_PROD: Joi.string().when('NODE_ENV', {
					is: 'production',
					then: Joi.required(),
					otherwise: Joi.optional(),
				}),
				MONGO_DEV: Joi.string().optional(),
				PORT_API: Joi.number().default(3007),
				PORT_BATCH: Joi.number().default(3008),
				// Every integration below is optional: the owning service becomes a
				// no-op when its key is absent, so a missing key never breaks boot.
				FRONTEND_URL: Joi.string().optional(),
				SESSION_SECRET: Joi.string().optional(),
				GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
				GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
				GOOGLE_CALLBACK_URL: Joi.string().optional().allow(''),
				TELEGRAM_BOT_TOKEN: Joi.string().optional().allow(''),
				ADMIN_TELEGRAM_CHAT_ID: Joi.string().optional().allow(''),
				RESEND_API_KEY: Joi.string().optional().allow(''),
				MAIL_FROM: Joi.string().optional().allow(''),
				GROQ_API_KEY: Joi.string().optional().allow(''),
				GEMINI_API_KEY: Joi.string().optional().allow(''),
				GEMINI_MODEL: Joi.string().optional().allow(''),
				AI_DAILY_LIMIT_MEMBER: Joi.number().optional(),
				AI_DAILY_LIMIT_ANON: Joi.number().optional(),
				DEMO_ORDER_FLOW: Joi.string().optional().allow(''),
				ORDER_DEPOSIT_RATE: Joi.number().optional(),
			}).or('MONGO_DEV', 'MONGO_PROD'),
		}),
		// Global rate limit (300 req/min per IP) via APP_GUARD; auth mutations and
		// uploads tighten this with per-resolver @Throttle overrides.
		ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 300 }]),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			// Base64 photo payloads for the AI photo finder exceed the 100kb default.
			bodyParserConfig: { limit: '15mb' },
			// Deeply nested queries are the cheapest GraphQL DoS; 8 covers every real query here.
			validationRules: [depthLimit(8)],
			context: ({ req, res }: { req: T; res: T }) => ({ req, res }),
			formatError: (error: T) => {
				const code = error?.extensions?.code;
				const message =
					error?.extensions?.exception?.response?.message || error?.extensions?.response?.message || error?.message;
				graphqlLogger.error(`${code ?? 'ERROR'}: ${JSON.stringify(message)}`);
				// Note: under Apollo Server 4 + @nestjs/graphql, intentional HttpExceptions
				// (401/404/429...) reach here with code INTERNAL_SERVER_ERROR and no recoverable
				// HTTP status, so they're indistinguishable from genuine 500s — masking by code
				// would hide real auth/validation messages ("Wrong password" etc.). formatError
				// never returns a stack, so we surface the message as the app always has.
				return {
					code,
					message,
				};
			},
		}),
		ComponentsModule, // http connection
		DatabaseModule,
		SocketModule, // tcp connection
	],
	controllers: [AppController],
	providers: [AppService, AppResolver, { provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class AppModule {}
