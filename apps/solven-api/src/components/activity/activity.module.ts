import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../../schemas/Order.model';
import ReviewSchema from '../../schemas/Review.model';
import CarSchema from '../../schemas/Car.model';
import ChatMessageSchema from '../../schemas/ChatMessage.model';
import { ActivityService } from './activity.service';
import { ActivityResolver } from './activity.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Order', schema: OrderSchema },
			{ name: 'Review', schema: ReviewSchema },
			{ name: 'Car', schema: CarSchema },
			{ name: 'ChatMessage', schema: ChatMessageSchema },
		]),
		AuthModule,
	],
	providers: [ActivityService, ActivityResolver],
})
export class ActivityModule {}
