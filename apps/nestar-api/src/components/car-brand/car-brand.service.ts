import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CarBrandService {
	constructor(@InjectModel('CarBrand') private readonly carBrandModel: Model<null>) {}
}
