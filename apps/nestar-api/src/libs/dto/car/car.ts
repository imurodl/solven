import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { CarColor, CarFuelType, CarLocation, CarOptions, CarStatus, CarTransmission, CarType } from '../../enums/car.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Car {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => CarType)
	carType: CarType;

	@Field(() => CarStatus)
	carStatus: CarStatus;

	@Field(() => CarLocation)
	carLocation: CarLocation;

	@Field(() => String)
	carAddress: string;

	@Field(() => String)
	carBrand: string;

	@Field(() => String)
	carModel: string;

	@Field(() => String)
	carTitle: string;

	@Field(() => Number)
	carPrice: number;

	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@Field(() => CarTransmission)
	carTransmission: CarTransmission;

	@Field(() => [CarOptions])
	carOptions: CarOptions[];

	@Field(() => CarColor)
	carColor: CarColor;

	@Field(() => Int)
	carMileage: number;

	@Field(() => Int)
	carSeats: number;

	@Field(() => Int)
	carViews: number;

	@Field(() => Int)
	carLikes: number;

	@Field(() => Int)
	carComments: number;

	@Field(() => Int)
	carRank: number;

	@Field(() => [String])
	carImages: string[];

	@Field(() => String, { nullable: true })
	carDesc: string;

	@Field(() => Boolean)
	carBarter: boolean;

	@Field(() => Boolean)
	carRent: boolean;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt: Date;

	@Field(() => Date, { nullable: true })
	deletedAt: Date;

	@Field(() => Date, { nullable: true })
	manufacturedAt: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/* From aggregation */

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Cars {
	@Field(() => [Car])
	list: Car[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
