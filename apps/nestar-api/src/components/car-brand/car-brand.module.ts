import { Module } from '@nestjs/common';
import { CarBrandService } from './car-brand.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CarBrandResolver } from './car-brand.resolver';
import CarBrandSchema from '../../schemas/CarBrand.model';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'CarBrand', schema: CarBrandSchema }]), AuthModule],
	providers: [CarBrandService, CarBrandResolver],
	exports: [CarBrandService],
})
export class CarBrandModule {}
