import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './google.strategy';
import { TelegramStrategy } from './telegram.strategy';
import { GoogleConfiguredGuard } from './google-configured.guard';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]), PassportModule, AuthModule],
	providers: [OAuthService, GoogleStrategy, TelegramStrategy, GoogleConfiguredGuard],
	controllers: [OAuthController],
	exports: [OAuthService],
})
export class OAuthModule {}
