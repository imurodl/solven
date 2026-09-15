import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityItem, ActivityService } from './activity.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';

@Resolver()
export class ActivityResolver {
	private readonly logger = new Logger(ActivityResolver.name);

	constructor(
		private readonly activityService: ActivityService,
		@InjectModel('ChatMessage') private readonly chatMessageModel: Model<T>,
	) {}

	@Query(() => [ActivityItem])
	public async getRecentActivity(
		@Args('limit', { type: () => Int, nullable: true }) limit?: number,
	): Promise<ActivityItem[]> {
		return await this.activityService.getRecentActivity(Math.min(Math.max(limit ?? 12, 1), 30));
	}

	// Wipes the public live-chat history (moderation / cleanup).
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Int)
	public async clearChatHistory(): Promise<number> {
		this.logger.log('Mutation: clearChatHistory');
		const result = await this.chatMessageModel.deleteMany({}).exec();
		return result.deletedCount ?? 0;
	}
}
