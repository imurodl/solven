import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ServiceJobSchema from '../../schemas/ServiceJob.model';
import { ServiceJobService } from './service-job.service';
import { ServiceJobResolver } from './service-job.resolver';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';
import { ViewModule } from '../view/view.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'ServiceJob', schema: ServiceJobSchema }]),
		AuthModule,
		MemberModule,
		ViewModule,
		LikeModule,
	],
	providers: [ServiceJobService, ServiceJobResolver],
	exports: [ServiceJobService],
})
export class ServiceJobModule {}
