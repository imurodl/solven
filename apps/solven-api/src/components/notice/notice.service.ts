import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TranslationService } from '../translation/translation.service';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { AllNoticesInquiry } from '../../libs/dto/notice/notice.inquiry';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class NoticeService {
	private readonly logger = new Logger(NoticeService.name);

	constructor(
		@InjectModel('Notice') private readonly noticeModel: Model<Notice>,
		private readonly translationService: TranslationService,
	) {}

	private translateInBackground(noticeId: ObjectId, title: string, content?: string): void {
		this.translationService
			.translate('notice', title, content)
			.then((translations) => {
				if (!translations) return;
				return this.noticeModel.findByIdAndUpdate(noticeId, { noticeTranslations: translations }).exec();
			})
			.catch((err) => this.logger.warn(`notice translation failed: ${err?.message}`));
	}

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			const result = await this.noticeModel.create({
				...input,
				memberId,
			});
			this.translateInBackground(result._id, result.noticeTitle, result.noticeContent);
			return result;
		} catch (err) {
			this.logger.log('Error, Service.createNotice:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getAllNotices(input: AllNoticesInquiry): Promise<Notices> {
		const { page = 1, limit = 10, noticeCategory, noticeStatus, search } = input;
		const match: T = {};

		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;

		if (search) {
			match.$or = [
				{ noticeTitle: { $regex: search, $options: 'i' } },
				{ noticeContent: { $regex: search, $options: 'i' } },
			];
		}

		try {
			const result = await this.noticeModel
				.aggregate([
					{ $match: match },
					{ $sort: { createdAt: -1 } },
					{
						$facet: {
							list: [
								{ $skip: (page - 1) * limit },
								{ $limit: limit },
								{
									$lookup: {
										from: 'members',
										localField: 'memberId',
										foreignField: '_id',
										as: 'memberData',
									},
								},
								{
									$unwind: {
										path: '$memberData',
										preserveNullAndEmptyArrays: true,
									},
								},
							],
							metaCounter: [
								{
									$group: {
										_id: '$noticeCategory',
										count: { $sum: 1 },
									},
								},
							],
						},
					},
				])
				.exec();

			return result[0];
		} catch (err) {
			this.logger.log('Error, Service.getAllNotices:', err.message);
			throw new BadRequestException(Message.NO_DATA_FOUND);
		}
	}

	public async getNotice(noticeId: ObjectId): Promise<Notice> {
		try {
			const result = await this.noticeModel
				.findOne({
					_id: noticeId,
					noticeStatus: NoticeStatus.ACTIVE,
				})
				.exec();

			if (!result) throw new BadRequestException(Message.NO_DATA_FOUND);
			return result;
		} catch (err) {
			this.logger.log('Error, Service.getNotice:', err.message);
			throw new BadRequestException(Message.NO_DATA_FOUND);
		}
	}

	public async updateNotice(memberId: ObjectId, noticeId: ObjectId, input: NoticeUpdate): Promise<Notice> {
		try {
			const result = await this.noticeModel
				.findOneAndUpdate(
					{
						_id: noticeId,
						memberId: memberId,
						noticeStatus: { $ne: NoticeStatus.DELETE },
					},
					input,
					{ new: true },
				)
				.exec();
			if (result && (input.noticeTitle !== undefined || input.noticeContent !== undefined)) {
				this.translateInBackground(result._id, result.noticeTitle, result.noticeContent);
			}

			if (!result) throw new BadRequestException(Message.UPDATE_FAILED);
			return result;
		} catch (err) {
			this.logger.log('Error, Service.updateNotice:', err.message);
			throw new BadRequestException(Message.UPDATE_FAILED);
		}
	}

	public async removeNotice(memberId: ObjectId, noticeId: ObjectId): Promise<Notice> {
		try {
			const result = await this.noticeModel
				.findOneAndUpdate(
					{
						_id: noticeId,
						memberId: memberId,
						noticeStatus: { $ne: NoticeStatus.DELETE },
					},
					{ noticeStatus: NoticeStatus.DELETE },
					{ new: true },
				)
				.exec();

			if (!result) throw new BadRequestException(Message.REMOVE_FAILED);
			return result;
		} catch (err) {
			this.logger.log('Error, Service.removeNotice:', err.message);
			throw new BadRequestException(Message.REMOVE_FAILED);
		}
	}
}
