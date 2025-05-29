import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import NotificationSchema from '../../schemas/Notification.model';
import { NotificationService } from './notification.service';
import { SocketModule } from '../../socket/socket.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Notification', schema: NotificationSchema }]),
		forwardRef(() => SocketModule),
	],
	providers: [NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
