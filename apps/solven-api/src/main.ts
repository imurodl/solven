import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { AllExceptionsFilter } from './libs/filter/AllExceptions.filter';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import * as session from 'express-session';
import helmet from 'helmet';
import { WsAdapter } from '@nestjs/platform-ws';
import { randomBytes } from 'crypto';
import { ensureUploadDirs, getAllowedOrigins } from './libs/config';

// Process-level handlers: without these an unhandled rejection either kills the
// process silently or leaves it hanging with no trace of the cause in the logs.
const processLogger = new Logger('Process');
process.on('unhandledRejection', (reason) => {
	processLogger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
});
process.on('uncaughtException', (err) => {
	// The process state is undefined after this; log and let Docker restart it
	// rather than keep a half-dead instance (e.g. one that never bound its port).
	processLogger.error(`Uncaught Exception: ${err.stack ?? err.message}`);
	setTimeout(() => process.exit(1), 100).unref();
});

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	// Trust the single nginx hop so req.ip reflects the real client IP (X-Forwarded-For)
	// rather than the proxy address — required for correct per-IP rate limiting.
	app.getHttpAdapter().getInstance().set('trust proxy', 1);
	// Security headers. CSP is disabled (this is a JSON/GraphQL API, not an HTML host)
	// and CORP is cross-origin so uploaded car images can be embedded by the frontend.
	app.use(
		helmet({
			contentSecurityPolicy: false,
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: 'cross-origin' },
		}),
	);
	// whitelist strips unknown top-level props; transform coerces payloads into DTO
	// instances so class-validator constraints (e.g. @Max page/limit caps) run.
	// forbidNonWhitelisted is intentionally omitted — the code-first GraphQL schema
	// already rejects unknown fields, and several @Field-only inputs carry no
	// class-validator decorators, so forbidding them would break valid requests.
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
	app.useGlobalInterceptors(new LoggingInterceptor());
	app.useGlobalFilters(new AllExceptionsFilter());

	const allowedOrigins = getAllowedOrigins();
	app.enableCors({
		origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
			// Same-origin / server-to-server requests carry no Origin header.
			if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	});

	// The default 100kb JSON limit is too small for base64 photos sent to the AI
	// photo-finder mutation.
	app.use(express.json({ limit: '15mb' }));
	app.use(express.urlencoded({ extended: true, limit: '15mb' }));

	app.use(graphqlUploadExpress({ maxFileSize: 30000000, maxFiles: 10 }));
	ensureUploadDirs();
	app.use('/uploads', express.static('./uploads'));

	// Short-lived session used only to carry OAuth state across the Google redirect.
	// A random secret is fine when SESSION_SECRET is unset: a restart only voids
	// in-flight (<10 min) OAuth attempts.
	app.use(
		session({
			secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: process.env.NODE_ENV === 'production',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 10 * 60 * 1000,
			},
		}),
	);

	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
