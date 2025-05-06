import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CarService } from './car.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { Cars, Car } from '../../libs/dto/car/car';
import { AgentCarsInquiry, AllCarsInquiry, OrdinaryInquiry, CarsInquiry, CarInput } from '../../libs/dto/car/car.input';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ObjectId } from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { CarUpdate } from '../../libs/dto/car/car.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class CarResolver {
	constructor(private readonly carService: CarService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Car)
	public async createCar(@Args('input') input: CarInput, @AuthMember('_id') memberId: ObjectId): Promise<Car> {
		console.log('Mutation: createCar');
		input.memberId = memberId;
		return await this.carService.createCar(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Car)
	public async getCar(@Args('carId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Car> {
		console.log('Query: getCar');
		const carId: ObjectId = shapeIntoMongoObjectId(input);
		return await this.carService.getCar(memberId, carId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Car)
	public async updateCar(@Args('input') input: CarUpdate, @AuthMember('_id') memberId: ObjectId): Promise<Car> {
		console.log('Mutation: updateCar');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.carService.updateCar(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Cars)
	public async getCars(@Args('input') input: CarsInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Cars> {
		console.log('Query: getCars');
		return await this.carService.getCars(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Cars)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getFavorites');
		return await this.carService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Cars)
	public async getVisited(@Args('input') input: OrdinaryInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Cars> {
		console.log('Query: getVisited');
		return await this.carService.getVisited(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Cars)
	public async getAgentCars(
		@Args('input') input: AgentCarsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getAgentCars');
		return await this.carService.getAgentCars(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Car)
	public async likeTargetCar(@Args('carId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Car> {
		console.log('Mutation: likeTargetCar');
		const likeRefId: ObjectId = shapeIntoMongoObjectId(input);
		return await this.carService.likeTargetCar(memberId, likeRefId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Cars)
	public async getAllCarsByAdmin(
		@Args('input') input: AllCarsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Cars> {
		console.log('Query: getAllCarsByAdmin');
		return await this.carService.getAllCarsByAdmin(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Car)
	public async updateCarByAdmin(@Args('input') input: CarUpdate): Promise<Car> {
		console.log('Mutation: updateCarByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.carService.updateCarByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Car)
	public async removeCarByAdmin(@Args('carId') input: string): Promise<Car> {
		console.log('Mutation: removeCarByAdmin');
		input = shapeIntoMongoObjectId(input);
		return await this.carService.removeCarByAdmin(input);
	}
}
