import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';

@Module({
	providers: [SocketGateway],
	imports: [AuthModule],
	exports: [SocketGateway],
})
export class SocketModule {}
