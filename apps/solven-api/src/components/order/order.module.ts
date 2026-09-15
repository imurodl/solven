import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../../schemas/Order.model';
import CarSchema from '../../schemas/Car.model';
import MemberSchema from '../../schemas/Member.model';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { TelegramNotifyService } from './telegram-notify.service';
import { MailNotifyService } from './mail-notify.service';
import { AuthModule } from '../auth/auth.module';
import { CouponModule } from '../coupon/coupon.module';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Order', schema: OrderSchema },
			{ name: 'Car', schema: CarSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		CouponModule,
		NotificationModule,
		SocketModule,
	],
	providers: [OrderService, OrderResolver, TelegramNotifyService, MailNotifyService],
	exports: [OrderService, TelegramNotifyService, MailNotifyService],
})
export class OrderModule {}
