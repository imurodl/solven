import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarBrand, CarBrandInput, CarBrandUpdate } from '../../libs/dto/car-brand/car-brand';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class CarBrandService {
	constructor(@InjectModel('CarBrand') private readonly carBrandModel: Model<CarBrand>) {}

	public async createCarBrand(input: CarBrandInput): Promise<CarBrand> {
		const createInput: T = {
			carBrandName: input.carBrandName.trim().toUpperCase(),
			carBrandModels: input.carBrandModels.map((brandModel) => brandModel.trim().toUpperCase()),
		};

		const exists: CarBrand | null = await this.carBrandModel.findOne({
			carBrandName: createInput.carBrandName,
		});
		if (exists) throw new BadRequestException(Message.SOMETHING_WENT_WRONG);

		try {
			return await this.carBrandModel.create(createInput);
		} catch (err) {
			console.log('Error, carBrandService:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getCarBrand(input: string): Promise<CarBrand> {
		const carBrandName = input.trim().toUpperCase();
		const result = await this.carBrandModel.findOne({ carBrandName }).exec();
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getAllCarBrands(): Promise<CarBrand[]> {
		return this.carBrandModel.find().sort({ carBrandName: 1 }).exec();
	}

	public async addCarBrandModel(input: CarBrandUpdate): Promise<CarBrand> {
		const name = input.carBrandName.trim().toUpperCase();
		const model = input.carBrandModel.trim().toUpperCase();

		const result = await this.carBrandModel
			.findOneAndUpdate(
				{
					carBrandName: name,
				},
				{
					$addToSet: {
						carBrandModels: model,
					},
				},
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		return result;
	}

	public async removeCarBrand(brandName: string): Promise<CarBrand> {
		const result = await this.carBrandModel.findOneAndDelete({ carBrandName: brandName });
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);

		return result;
	}
}
