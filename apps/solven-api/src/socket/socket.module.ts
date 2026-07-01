import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import { NotificationModule } from '../components/notification/notification.module';
import ChatMessageSchema from '../schemas/ChatMessage.model';

@Module({
	providers: [SocketGateway],
	imports: [
		AuthModule,
		forwardRef(() => NotificationModule),
		MongooseModule.forFeature([{ name: 'ChatMessage', schema: ChatMessageSchema }]),
	],
	exports: [SocketGateway],
})
export class SocketModule {}
