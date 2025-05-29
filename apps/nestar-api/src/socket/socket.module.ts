import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';
import { NotificationModule } from '../components/notification/notification.module';

@Module({
	providers: [SocketGateway],
	imports: [AuthModule, forwardRef(() => NotificationModule)],
	exports: [SocketGateway],
})
export class SocketModule {}
