import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import {
	CarAvailability,
	CarColor,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarOptions,
	CarStatus,
	CarTransmission,
	CarType,
} from '../../enums/car.enum';
import { Translations } from '../common/translations';
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

	@Field(() => Number, { nullable: true })
	carSalePrice?: number;

	@Field(() => Boolean, { nullable: true })
	carIsOnSale?: boolean;

	@Field(() => Date, { nullable: true })
	carSaleStartsAt?: Date;

	@Field(() => Date, { nullable: true })
	carSaleExpiresAt?: Date;

	@Field(() => CarAvailability, { nullable: true })
	carAvailability?: CarAvailability;

	@Field(() => CarCondition, { nullable: true })
	carCondition?: CarCondition;

	@Field(() => Float, { nullable: true })
	carRating?: number;

	@Field(() => Int, { nullable: true })
	carReviews?: number;

	@Field(() => Int, { nullable: true })
	carSoldCount?: number;

	@Field(() => Translations, { nullable: true })
	carTranslations?: Translations;

	@Field(() => [String], { nullable: true })
	carImageCredits?: string[];

	@Field(() => String, { nullable: true })
	car3dModel?: string;

	@Field(() => String, { nullable: true })
	carVin?: string;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt: Date;

	@Field(() => Date, { nullable: true })
	deletedAt: Date;

	@Field(() => Number, { nullable: true })
	manufacturedAt: number;

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
