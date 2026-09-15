import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_CARS, BATCH_TOP_MECHANICS } from './libs/config';

@Controller()
export class BatchController {
	constructor(private readonly batchService: BatchService) {}
	private logger: Logger = new Logger('BatchController');

	@Timeout(1000)
	handleTimeout() {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK })
	public async batchRollback() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTED');
			await this.batchService.batchRollback();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_CARS })
	public async batchTopCars() {
		try {
			this.logger['context'] = BATCH_TOP_CARS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchTopCars();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_TOP_AGENTS })
	public async batchTopAgents() {
		try {
			this.logger['context'] = BATCH_TOP_AGENTS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchTopAgents();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('50 00 01 * * *', { name: BATCH_TOP_MECHANICS })
	public async batchTopMechanics() {
		try {
			this.logger['context'] = BATCH_TOP_MECHANICS;
			this.logger.debug('EXECUTED');
			await this.batchService.batchTopMechanics();
		} catch (err) {
			this.logger.error(err);
		}
	}

	// Manual trigger (internal port, not exposed by nginx): recompute all ranks now.
	// Used right after seeding so the homepage sections have meaningful ordering.
	@Get('run-ranking')
	public async runRanking(): Promise<{ ok: boolean }> {
		await this.batchService.batchRollback();
		await this.batchService.batchTopCars();
		await this.batchService.batchTopAgents();
		await this.batchService.batchTopMechanics();
		return { ok: true };
	}

	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
