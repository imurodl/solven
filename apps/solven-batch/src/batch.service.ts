import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member, Members } from 'apps/solven-api/src/libs/dto/member/member';
import { Car } from 'apps/solven-api/src/libs/dto/car/car';
import { MemberStatus, MemberType } from 'apps/solven-api/src/libs/enums/member.enum';
import { CarStatus } from 'apps/solven-api/src/libs/enums/car.enum';
import { Model } from 'mongoose';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Car') private readonly carModel: Model<Car>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('ServiceJob') private readonly serviceJobModel: Model<any>,
	) {}

	public async batchRollback(): Promise<void> {
		await this.carModel
			.updateMany(
				{ carStatus: CarStatus.ACTIVE },
				{ carRank: 0 }, //
			)
			.exec();

		await this.memberModel
			.updateMany(
				{ memberStatus: MemberStatus.ACTIVE, memberType: { $in: [MemberType.AGENT, MemberType.MECHANIC] } },
				{ memberRank: 0 }, //
			)
			.exec();
		await this.serviceJobModel.updateMany({ serviceStatus: 'ACTIVE' }, { serviceRank: 0 }).exec();
	}

	public async batchTopCars(): Promise<void> {
		const cars: Car[] = await this.carModel.find({ carStatus: CarStatus.ACTIVE, carRank: 0 }).exec();

		const bulkOps = cars.map((ele: Car) => {
			const { _id, carLikes, carViews, carReviews = 0, carSoldCount = 0 } = ele;
			const rank = carLikes * 2 + carViews * 1 + carReviews * 3 + carSoldCount * 5;
			return { updateOne: { filter: { _id }, update: { $set: { carRank: rank } } } };
		});
		if (bulkOps.length) await this.carModel.bulkWrite(bulkOps);
	}

	public async batchTopMechanics(): Promise<void> {
		const mechanics: Member[] = await this.memberModel
			.find({ memberType: MemberType.MECHANIC, memberStatus: MemberStatus.ACTIVE, memberRank: 0 })
			.exec();
		const bulkOps = mechanics.map((ele: Member) => {
			const { _id, memberServiceJobs = 0, memberViews, memberLikes, memberReviews = 0 } = ele;
			const rank = memberServiceJobs * 5 + memberReviews * 3 + memberLikes * 2 + memberViews * 1;
			return { updateOne: { filter: { _id }, update: { $set: { memberRank: rank } } } };
		});
		if (bulkOps.length) await this.memberModel.bulkWrite(bulkOps);

		const jobs = await this.serviceJobModel.find({ serviceStatus: 'ACTIVE', serviceRank: 0 }).exec();
		const jobOps = jobs.map((job: any) => ({
			updateOne: {
				filter: { _id: job._id },
				update: { $set: { serviceRank: job.serviceLikes * 2 + job.serviceViews } },
			},
		}));
		if (jobOps.length) await this.serviceJobModel.bulkWrite(jobOps);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({ memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE, memberRank: 0 })
			.exec();

		const bulkOps = agents.map((ele: Member) => {
			const { _id, memberArticles, memberViews, memberLikes, memberCars, memberReviews = 0 } = ele;
			const rank = memberCars * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1 + memberReviews * 4;
			return { updateOne: { filter: { _id }, update: { $set: { memberRank: rank } } } };
		});
		if (bulkOps.length) await this.memberModel.bulkWrite(bulkOps);
	}

	getHello(): string {
		return 'Welcome to Nestar BATCH Server!';
	}
}
