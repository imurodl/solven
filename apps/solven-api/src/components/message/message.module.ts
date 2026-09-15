import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MessageSchema from '../../schemas/Message.model';
import CarSchema from '../../schemas/Car.model';
import MemberSchema from '../../schemas/Member.model';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Car', schema: CarSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		NotificationModule,
		SocketModule,
	],
	providers: [MessageService, MessageResolver],
	exports: [MessageService],
})
export class MessageModule {}
