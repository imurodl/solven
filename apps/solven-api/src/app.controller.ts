import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		@InjectConnection() private readonly connection: Connection,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	// Unauthenticated liveness/readiness probe. Returns 503 when the DB is not
	// connected (readyState 1 === connected) so orchestrators can detect it.
	@Get('health')
	health(): { status: string; db: string } {
		const dbUp = this.connection.readyState === 1;
		if (!dbUp) throw new ServiceUnavailableException({ status: 'error', db: 'down' });
		return { status: 'ok', db: 'up' };
	}
}
