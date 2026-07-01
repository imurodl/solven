import { Module } from '@nestjs/common';
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

@Module({
	imports: [
		ConfigModule.forRoot(),
		// Rate limiting is opt-in per-resolver (no global APP_GUARD) — only auth mutations use it.
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
				const graphQLFormattedError = {
					code: error?.extensions.code,
					message:
						error?.extensions?.exception?.response?.message || error?.extensions?.response?.message || error?.message,
				};
				console.log('GRAPHQL GLOBAL ERR:', graphQLFormattedError);
				return graphQLFormattedError;
			},
		}),
		ComponentsModule, // http connection
		DatabaseModule, SocketModule, // tcp connection
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
