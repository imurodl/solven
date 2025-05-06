import { Module } from '@nestjs/common';
import { CarResolver } from './car.resolver';
import { CarService } from './car.service';
import { MongooseModule } from '@nestjs/mongoose';
import CarSchema from '../../schemas/Car.model';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Car', schema: CarSchema }]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
	],
	providers: [CarResolver, CarService],
	exports: [CarService],
})
export class CarModule {}
