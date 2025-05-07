import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CarBrandService } from './car-brand.service';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CarBrand, CarBrandInput, CarBrandUpdate } from '../../libs/dto/car-brand/car-brand';

@Resolver()
export class CarBrandResolver {
	constructor(private readonly carBrandService: CarBrandService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async createCarBrand(@Args('input') input: CarBrandInput): Promise<CarBrand> {
		console.log('Mutation: createCarBrand');
		return await this.carBrandService.createCarBrand(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => CarBrand)
	public async getCarBrand(@Args('input') input: string): Promise<CarBrand> {
		console.log('Mutation: getCarBrand');
		return await this.carBrandService.getCarBrand(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => [CarBrand])
	public async getAllCarBrands(): Promise<CarBrand[]> {
		console.log('Mutation: getAllCarBrands');
		return await this.carBrandService.getAllCarBrands();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async addCarBrandModel(@Args('input') input: CarBrandUpdate): Promise<CarBrand> {
		console.log('Mutation: addCarBrandModel');
		return await this.carBrandService.addCarBrandModel(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async removeCarBrand(@Args('carBrandName') input: string): Promise<CarBrand> {
		console.log('Mutation: removeCarBrand');
		return await this.carBrandService.removeCarBrand(input);
	}
}
