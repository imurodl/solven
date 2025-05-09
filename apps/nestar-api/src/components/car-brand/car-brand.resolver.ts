import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CarBrandService } from './car-brand.service';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CarBrand, CarBrandInput, CarBrandModelInput, CarBrandUpdate } from '../../libs/dto/car-brand/car-brand';
import { WithoutGuard } from '../auth/guards/without.guard';

@Resolver()
export class CarBrandResolver {
	constructor(private readonly carBrandService: CarBrandService) {}

	@UseGuards(WithoutGuard)
	@UseGuards(RolesGuard)
	@Query(() => CarBrand)
	public async getCarBrandByUser(@Args('input') input: string): Promise<CarBrand> {
		console.log('Query: getCarBrandByUser');
		return await this.carBrandService.getCarBrandByUser(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => [CarBrand])
	public async getCarBrandsByUser(): Promise<CarBrand[]> {
		console.log('Query: getCarBrandsByUser');
		return await this.carBrandService.getCarBrandsByUser();
	}

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
		console.log('Query: getCarBrand');
		return await this.carBrandService.getCarBrand(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => [CarBrand])
	public async getCarBrands(): Promise<CarBrand[]> {
		console.log('Query: getCarBrands');
		return await this.carBrandService.getCarBrands();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async updateCarBrand(@Args('input') input: CarBrandUpdate): Promise<CarBrand> {
		console.log('Mutation: updateCarBrand');
		return await this.carBrandService.updateCarBrand(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async deleteCarBrandModel(@Args('input') input: CarBrandModelInput): Promise<CarBrand> {
		console.log('Mutation: deleteCarBrandModel');
		return await this.carBrandService.deleteCarBrandModel(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => CarBrand)
	public async removeCarBrand(@Args('carBrandName') input: string): Promise<CarBrand> {
		console.log('Mutation: removeCarBrand');
		return await this.carBrandService.removeCarBrand(input);
	}
}
