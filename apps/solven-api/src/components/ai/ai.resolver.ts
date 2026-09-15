import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { AiQuotaService } from './ai-quota.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { AiStatus, CarDescriptionResult, CarPhotoAnalysis, CarPriceEstimate } from '../../libs/dto/ai/ai';
import { CarDescriptionInput, CarPhotoAnalysisInput, CarPriceEstimateInput } from '../../libs/dto/ai/ai.input';
import { T } from '../../libs/types/common';

@Resolver()
export class AiResolver {
	private readonly logger = new Logger(AiResolver.name);

	constructor(
		private readonly aiService: AiService,
		private readonly quota: AiQuotaService,
	) {}

	// nginx sets X-Forwarded-For; trust proxy makes req.ip correct as well.
	private resolveIp(ctx: T): string | undefined {
		const req = ctx?.req;
		const forwarded = req?.headers?.['x-forwarded-for'];
		if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
		return req?.ip || req?.socket?.remoteAddress;
	}

	@UseGuards(WithoutGuard)
	@Query(() => AiStatus)
	public async getAiStatus(@AuthMember('_id') memberId: ObjectId, @Context() ctx: T): Promise<AiStatus> {
		return {
			photoFinder: this.aiService.hasVision(),
			priceCheck: true,
			descriptionWriter: this.aiService.hasText(),
			remainingToday: this.quota.remaining(memberId?.toString(), this.resolveIp(ctx)),
		};
	}

	@Throttle({ default: { limit: 6, ttl: 60000 } })
	@UseGuards(WithoutGuard)
	@Mutation(() => CarPhotoAnalysis)
	public async analyzeCarPhoto(
		@Args('input') input: CarPhotoAnalysisInput,
		@AuthMember('_id') memberId: ObjectId,
		@Context() ctx: T,
	): Promise<CarPhotoAnalysis> {
		this.logger.log('Mutation: analyzeCarPhoto');
		this.quota.consume(memberId?.toString(), this.resolveIp(ctx));
		return await this.aiService.analyzeCarPhoto(memberId, input);
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@UseGuards(WithoutGuard)
	@Query(() => CarPriceEstimate)
	public async estimateCarPrice(@Args('input') input: CarPriceEstimateInput): Promise<CarPriceEstimate> {
		this.logger.log('Query: estimateCarPrice');
		return await this.aiService.estimateCarPrice(input);
	}

	@Roles(MemberType.AGENT, MemberType.ADMIN, MemberType.USER)
	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(AuthGuard, RolesGuard)
	@Mutation(() => CarDescriptionResult)
	public async generateCarDescription(
		@Args('input') input: CarDescriptionInput,
		@AuthMember('_id') memberId: ObjectId,
		@Context() ctx: T,
	): Promise<CarDescriptionResult> {
		this.logger.log('Mutation: generateCarDescription');
		this.quota.consume(memberId?.toString(), this.resolveIp(ctx));
		return await this.aiService.generateCarDescription(input);
	}
}
