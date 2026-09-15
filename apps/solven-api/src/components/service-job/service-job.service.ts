import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import * as moment from 'moment';
import { ServiceJob, ServiceJobs } from '../../libs/dto/service-job/service-job';
import {
	AllServiceJobsInquiry,
	ServiceJobInput,
	ServiceJobsInquiry,
	ServiceJobUpdate,
} from '../../libs/dto/service-job/service-job.input';
import { ServiceJobStatus } from '../../libs/enums/service-job.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { buildSearchRegex, lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { TranslationService } from '../translation/translation.service';

@Injectable()
export class ServiceJobService {
	private readonly logger = new Logger(ServiceJobService.name);

	constructor(
		@InjectModel('ServiceJob') private readonly serviceJobModel: Model<ServiceJob>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly translationService: TranslationService,
	) {}

	private translateInBackground(id: ObjectId, title: string, desc?: string): void {
		this.translationService
			.translate('service', title, desc)
			.then((translations) => {
				if (!translations) return;
				return this.serviceJobModel.findByIdAndUpdate(id, { serviceTranslations: translations }).exec();
			})
			.catch((err) => this.logger.warn(`service translation failed: ${err?.message}`));
	}

	public async createServiceJob(input: ServiceJobInput): Promise<ServiceJob> {
		try {
			const result = await this.serviceJobModel.create({ ...input, carBrand: input.carBrand.toUpperCase() });
			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberServiceJobs', modifier: 1 });
			this.translateInBackground(result._id, result.serviceTitle, result.serviceDesc);
			return result;
		} catch (err: any) {
			this.logger.error(`createServiceJob: ${err.message}`);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getServiceJob(memberId: ObjectId, jobId: ObjectId): Promise<ServiceJob> {
		const search: T = { _id: jobId, serviceStatus: ServiceJobStatus.ACTIVE };
		const target: ServiceJob | null = await this.serviceJobModel.findOne(search).lean().exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const newView = await this.viewService.recordView({
				memberId,
				viewRefId: jobId,
				viewGroup: ViewGroup.SERVICE_JOB,
			});
			if (newView) {
				await this.statsEditor({ _id: jobId, targetKey: 'serviceViews', modifier: 1 });
				target.serviceViews++;
			}
			target.meLiked = await this.likeService.checkLikeExistence({
				memberId,
				likeRefId: jobId,
				likeGroup: LikeGroup.SERVICE_JOB,
			});
		}
		target.memberData = await this.memberService.getMember(null, target.memberId);
		return target;
	}

	public async updateServiceJob(memberId: ObjectId, input: ServiceJobUpdate): Promise<ServiceJob> {
		const { serviceStatus } = input;
		let { deletedAt } = input;
		if (serviceStatus === ServiceJobStatus.DELETE) deletedAt = moment().toDate();
		if (input.carBrand) input.carBrand = input.carBrand.toUpperCase();

		const result = await this.serviceJobModel
			.findOneAndUpdate(
				{ _id: input._id, memberId, serviceStatus: ServiceJobStatus.ACTIVE },
				{ ...input, deletedAt },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (deletedAt)
			await this.memberService.memberStatsEditor({ _id: memberId, targetKey: 'memberServiceJobs', modifier: -1 });
		if (input.serviceTitle !== undefined || input.serviceDesc !== undefined) {
			this.translateInBackground(result._id, result.serviceTitle, result.serviceDesc);
		}
		return result;
	}

	public async getServiceJobs(memberId: ObjectId, input: ServiceJobsInquiry): Promise<ServiceJobs> {
		const match: T = { serviceStatus: ServiceJobStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const { memberId: ownerId, typeList, locationList, brandList, maxPrice, text } = input.search;

		if (ownerId) match.memberId = shapeIntoMongoObjectId(ownerId);
		if (typeList?.length) match.serviceType = { $in: typeList };
		if (locationList?.length) match.serviceLocation = { $in: locationList };
		if (brandList?.length) match.carBrand = { $in: brandList.map((b) => b.toUpperCase()) };
		if (maxPrice) match.servicePrice = { $lte: maxPrice };
		if (text) match.serviceTitle = buildSearchRegex(text);

		const result = await this.serviceJobModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async getMechanicServiceJobs(memberId: ObjectId, input: ServiceJobsInquiry): Promise<ServiceJobs> {
		const match: T = { memberId, serviceStatus: { $ne: ServiceJobStatus.DELETE } };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const result = await this.serviceJobModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async likeTargetServiceJob(memberId: ObjectId, likeRefId: ObjectId): Promise<ServiceJob> {
		const target = await this.serviceJobModel
			.findOne({ _id: likeRefId, serviceStatus: ServiceJobStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const modifier = await this.likeService.toggleLike({ memberId, likeRefId, likeGroup: LikeGroup.SERVICE_JOB });
		const result = await this.statsEditor({ _id: likeRefId, targetKey: 'serviceLikes', modifier });
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	/** ADMIN **/
	public async getAllServiceJobsByAdmin(input: AllServiceJobsInquiry): Promise<ServiceJobs> {
		const match: T = {};
		if (input.search.serviceStatus) match.serviceStatus = input.search.serviceStatus;
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };
		const result = await this.serviceJobModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateServiceJobByAdmin(input: ServiceJobUpdate): Promise<ServiceJob> {
		let { deletedAt } = input;
		if (input.serviceStatus === ServiceJobStatus.DELETE) deletedAt = moment().toDate();
		const result = await this.serviceJobModel
			.findOneAndUpdate(
				{ _id: input._id, serviceStatus: ServiceJobStatus.ACTIVE },
				{ ...input, deletedAt },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		if (deletedAt)
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberServiceJobs',
				modifier: -1,
			});
		return result;
	}

	public async removeServiceJobByAdmin(jobId: ObjectId): Promise<ServiceJob> {
		const result = await this.serviceJobModel
			.findOneAndDelete({ _id: jobId, serviceStatus: ServiceJobStatus.DELETE })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	public async statsEditor({ _id, targetKey, modifier }: StatisticModifier): Promise<ServiceJob | null> {
		return await this.serviceJobModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}
}
