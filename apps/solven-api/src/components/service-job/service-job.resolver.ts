import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { ServiceJobService } from './service-job.service';
import { ServiceJob, ServiceJobs } from '../../libs/dto/service-job/service-job';
import {
	AllServiceJobsInquiry,
	ServiceJobInput,
	ServiceJobsInquiry,
	ServiceJobUpdate,
} from '../../libs/dto/service-job/service-job.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class ServiceJobResolver {
	private readonly logger = new Logger(ServiceJobResolver.name);

	constructor(private readonly serviceJobService: ServiceJobService) {}

	@Roles(MemberType.MECHANIC, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => ServiceJob)
	public async createServiceJob(
		@Args('input') input: ServiceJobInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJob> {
		this.logger.log('Mutation: createServiceJob');
		input.memberId = memberId;
		return await this.serviceJobService.createServiceJob(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => ServiceJob)
	public async getServiceJob(
		@Args('serviceJobId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJob> {
		this.logger.log('Query: getServiceJob');
		return await this.serviceJobService.getServiceJob(memberId, shapeIntoMongoObjectId(input));
	}

	@Roles(MemberType.MECHANIC, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => ServiceJob)
	public async updateServiceJob(
		@Args('input') input: ServiceJobUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJob> {
		this.logger.log('Mutation: updateServiceJob');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.serviceJobService.updateServiceJob(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => ServiceJobs)
	public async getServiceJobs(
		@Args('input') input: ServiceJobsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJobs> {
		this.logger.log('Query: getServiceJobs');
		return await this.serviceJobService.getServiceJobs(memberId, input);
	}

	@Roles(MemberType.MECHANIC, MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => ServiceJobs)
	public async getMechanicServiceJobs(
		@Args('input') input: ServiceJobsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJobs> {
		this.logger.log('Query: getMechanicServiceJobs');
		return await this.serviceJobService.getMechanicServiceJobs(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => ServiceJob)
	public async likeTargetServiceJob(
		@Args('serviceJobId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<ServiceJob> {
		this.logger.log('Mutation: likeTargetServiceJob');
		return await this.serviceJobService.likeTargetServiceJob(memberId, shapeIntoMongoObjectId(input));
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => ServiceJobs)
	public async getAllServiceJobsByAdmin(@Args('input') input: AllServiceJobsInquiry): Promise<ServiceJobs> {
		this.logger.log('Query: getAllServiceJobsByAdmin');
		return await this.serviceJobService.getAllServiceJobsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => ServiceJob)
	public async updateServiceJobByAdmin(@Args('input') input: ServiceJobUpdate): Promise<ServiceJob> {
		this.logger.log('Mutation: updateServiceJobByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.serviceJobService.updateServiceJobByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => ServiceJob)
	public async removeServiceJobByAdmin(@Args('serviceJobId') input: string): Promise<ServiceJob> {
		this.logger.log('Mutation: removeServiceJobByAdmin');
		return await this.serviceJobService.removeServiceJobByAdmin(shapeIntoMongoObjectId(input));
	}
}
