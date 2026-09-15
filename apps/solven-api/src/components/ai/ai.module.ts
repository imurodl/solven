import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CarSchema from '../../schemas/Car.model';
import CarBrandSchema from '../../schemas/CarBrand.model';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { AiQuotaService } from './ai-quota.service';
import { AuthModule } from '../auth/auth.module';
import { CarModule } from '../car/car.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Car', schema: CarSchema },
			{ name: 'CarBrand', schema: CarBrandSchema },
		]),
		AuthModule,
		CarModule,
	],
	providers: [AiService, AiResolver, AiQuotaService],
	exports: [AiService],
})
export class AiModule {}
