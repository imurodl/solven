import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import CouponSchema from '../../schemas/Coupon.model';
import { CouponService } from './coupon.service';
import { CouponResolver } from './coupon.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Coupon', schema: CouponSchema }]), AuthModule],
	providers: [CouponService, CouponResolver],
	exports: [CouponService],
})
export class CouponModule {}
