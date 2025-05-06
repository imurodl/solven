import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/car/car.input';
import { Cars } from '../../libs/dto/car/car';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupVisited } from '../../libs/config';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		if (!viewExist) {
			console.log('-- New View Insert --');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId: memberId, viewRefId: viewRefId };
		return await this.viewModel.findOne(search).exec();
	}

	public async getVisitedCars(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
		const { page, limit } = input;
		const match: T = { viewGroup: ViewGroup.CAR, memberId: memberId };

		const data = await this.viewModel
			.aggregate([
				{ $match: match },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'cars',
						foreignField: '_id',
						localField: 'viewRefId',
						as: 'visitedCar',
					},
				},
				{ $unwind: '$visitedCar' },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupVisited,
							{ $unwind: '$visitedCar.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		const result: Cars = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele) => ele.visitedCar);
		console.log('result', result);

		return result;
	}
}
