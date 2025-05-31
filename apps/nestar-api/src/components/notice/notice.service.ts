import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { NoticeInput, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { AllNoticesInquiry } from '../../libs/dto/notice/notice.inquiry';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { T } from '../../libs/types/common';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			const result = await this.noticeModel.create({
				...input,
				memberId,
			});
			return result;
		} catch (err) {
			console.log('Error, Service.createNotice:', err.message);
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
			console.log('Error, Service.getAllNotices:', err.message);
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
			console.log('Error, Service.getNotice:', err.message);
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

			if (!result) throw new BadRequestException(Message.UPDATE_FAILED);
			return result;
		} catch (err) {
			console.log('Error, Service.updateNotice:', err.message);
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
			console.log('Error, Service.removeNotice:', err.message);
			throw new BadRequestException(Message.REMOVE_FAILED);
		}
	}
}
