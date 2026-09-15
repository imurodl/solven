import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ObjectId } from 'mongoose';
import { CarLocation } from '../../enums/car.enum';
import { ServiceJobStatus, ServiceType } from '../../enums/service-job.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import { Translations } from '../common/translations';

@ObjectType()
export class ServiceJob {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ServiceType)
	serviceType: ServiceType;

	@Field(() => ServiceJobStatus)
	serviceStatus: ServiceJobStatus;

	@Field(() => String)
	serviceTitle: string;

	@Field(() => String, { nullable: true })
	serviceDesc?: string;

	@Field(() => String)
	carBrand: string;

	@Field(() => String)
	carModel: string;

	@Field(() => Int, { nullable: true })
	manufacturedAt?: number;

	@Field(() => Number)
	servicePrice: number;

	@Field(() => Int)
	serviceDuration: number;

	@Field(() => [String])
	serviceImages: string[];

	@Field(() => CarLocation)
	serviceLocation: CarLocation;

	@Field(() => String)
	serviceAddress: string;

	@Field(() => Int)
	serviceViews: number;

	@Field(() => Int)
	serviceLikes: number;

	@Field(() => Int)
	serviceComments: number;

	@Field(() => Int)
	serviceRank: number;

	@Field(() => Translations, { nullable: true })
	serviceTranslations?: Translations;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/
	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class ServiceJobs {
	@Field(() => [ServiceJob])
	list: ServiceJob[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
