import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarBrand, CarBrandInput, CarBrandModelInput, CarBrandUpdate } from '../../libs/dto/car-brand/car-brand';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { CarBrandStatus } from '../../libs/enums/car.enum';

@Injectable()
export class CarBrandService {
	constructor(@InjectModel('CarBrand') private readonly carBrandModel: Model<CarBrand>) {}

	public async getCarBrandByUser(input: string): Promise<CarBrand> {
		const match: T = {
			carBrandName: input.trim().toUpperCase(),
			carBrandStatus: CarBrandStatus.ACTIVE,
		};
		const result = await this.carBrandModel.findOne(match).exec();
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		return result;
	}

	public async getCarBrandsByUser(): Promise<CarBrand[]> {
		return this.carBrandModel.find({ carBrandStatus: CarBrandStatus.ACTIVE }).sort({ carBrandName: 1 }).exec();
	}

	public async createCarBrand(input: CarBrandInput): Promise<CarBrand> {
		const createInput: CarBrandInput = {
			carBrandName: input.carBrandName.trim().toUpperCase(),
			carBrandModels: input.carBrandModels.map((brandModel) => brandModel.trim()),
		};

		if (input?.carBrandImg) {
			createInput.carBrandImg = input.carBrandImg;
		}

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

	public async getCarBrands(): Promise<CarBrand[]> {
		return this.carBrandModel.find().sort({ carBrandName: 1 }).exec();
	}

	public async updateCarBrand(input: CarBrandUpdate): Promise<CarBrand> {
		const name = input.carBrandName.trim().toUpperCase();

		const brand = await this.carBrandModel.findOne({ carBrandName: name }).exec();
		if (!brand) throw new BadRequestException(Message.NO_DATA_FOUND);

		// Add model if provided
		if (input.carBrandModel) {
			const model = input.carBrandModel.trim();
			if (brand.carBrandModels.includes(model)) {
				throw new BadRequestException(Message.UPDATE_FAILED);
			}
			brand.carBrandModels.push(model);
		}

		// Update status if provided
		if (input.carBrandStatus) {
			brand.carBrandStatus = input.carBrandStatus;
		}

		// Update image if provided
		if (input.carBrandImg) {
			brand.carBrandImg = input.carBrandImg;
		}

		await brand.save();
		return brand;
	}

	public async deleteCarBrandModel(input: CarBrandModelInput): Promise<CarBrand> {
		const name = input.carBrandName.trim().toUpperCase();
		const model = input.carBrandModel.trim();

		const result = await this.carBrandModel
			.findOneAndUpdate({ carBrandName: name }, { $pull: { carBrandModels: model } }, { new: true })
			.exec();

		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
		return result;
	}

	public async removeCarBrand(brandName: string): Promise<CarBrand> {
		const result = await this.carBrandModel
			.findOneAndDelete({
				carBrandName: brandName.trim().toUpperCase(),
				carBrandStatus: CarBrandStatus.DELETE,
			})
			.exec();
		console.log('result:', result);
		if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);

		return result;
	}
}
