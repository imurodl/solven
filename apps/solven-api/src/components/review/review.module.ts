import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ReviewSchema from '../../schemas/Review.model';
import OrderSchema from '../../schemas/Order.model';
import CarSchema from '../../schemas/Car.model';
import MemberSchema from '../../schemas/Member.model';
import { ReviewService } from './review.service';
import { ReviewResolver } from './review.resolver';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Review', schema: ReviewSchema },
			{ name: 'Order', schema: OrderSchema },
			{ name: 'Car', schema: CarSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		NotificationModule,
	],
	providers: [ReviewService, ReviewResolver],
	exports: [ReviewService],
})
export class ReviewModule {}
