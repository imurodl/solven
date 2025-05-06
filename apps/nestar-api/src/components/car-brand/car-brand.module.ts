import { Module } from '@nestjs/common';
import { CarBrandService } from './car-brand.service';
import { MongooseModule } from '@nestjs/mongoose';
import CarBrandSchema from '../../schemas/CarBrand.model';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'CarBrand', schema: CarBrandSchema }])],
	providers: [CarBrandService],
	exports: [CarBrandService],
})
export class CarBrandModule {}
