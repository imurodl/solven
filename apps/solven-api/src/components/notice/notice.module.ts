import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeResolver } from './notice.resolver';
import { NoticeService } from './notice.service';
import { AuthModule } from '../auth/auth.module';
import NoticeSchema from '../../schemas/Notice.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Notice', schema: NoticeSchema }]),
		AuthModule,
	],
	providers: [NoticeResolver, NoticeService],
	exports: [NoticeService],
})
export class NoticeModule {}