import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
	AgentsInquiry,
	LoginInput,
	MechanicsInquiry,
	MemberInput,
	MembersInquiry,
} from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ObjectId } from 'mongoose';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { assertUploadTarget, saveImageUpload, saveModelUpload } from '../../libs/upload';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from '../auth/guards/gql-throttler.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';

@Resolver()
export class MemberResolver {
	private readonly logger = new Logger(MemberResolver.name);

	constructor(private readonly memberService: MemberService) {}

	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@UseGuards(GqlThrottlerGuard)
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		this.logger.log('Mutation: signup');
		return await this.memberService.signup(input);
	}

	@Throttle({ default: { limit: 10, ttl: 60000 } })
	@UseGuards(GqlThrottlerGuard)
	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		this.logger.log('Mutation: login');
		return await this.memberService.login(input);
	}

	@Mutation(() => Member)
	public async refreshToken(@Args('refreshToken') refreshToken: string): Promise<Member> {
		this.logger.log('Mutation: refreshToken');
		return await this.memberService.refreshToken(refreshToken);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async logout(@AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		this.logger.log('Mutation: logout');
		return await this.memberService.logout(memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		this.logger.log('Mutation: updateMember');
		delete input._id;
		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Member)
	public async getMyProfile(@AuthMember('_id') memberId: ObjectId): Promise<Member> {
		this.logger.log('Query: getMyProfile');
		return await this.memberService.getMyProfile(memberId);
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
		this.logger.log('Query: checkAuth');
		this.logger.log('memberNick:', memberNick);
		return `Hi ${memberNick}!`;
	}

	@Roles(MemberType.USER, MemberType.AGENT, MemberType.MECHANIC)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		this.logger.log('Query: checkAuthRoles');
		return `Hi ${authMember.memberNick}!, you are ${authMember.memberType} (memberId: ${authMember._id})`;
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(@Args('memberId') input: string, @AuthMember('_id') memberId: ObjectId): Promise<Member> {
		this.logger.log('Query: getMember');
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(@Args('input') input: AgentsInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Members> {
		this.logger.log('Query: getAgents');
		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getMechanics(
		@Args('input') input: MechanicsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Members> {
		this.logger.log('Query: getMechanics');
		return await this.memberService.getMechanics(memberId, input);
	}

	@Throttle({ default: { limit: 60, ttl: 60000 } })
	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		this.logger.log('Mutation: likeTargetMember');
		const likeRefId: ObjectId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		this.logger.log('Query: getAllMembersByAdmin');
		return await this.memberService.getAllMembersByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(@Args('input') input: MemberUpdate): Promise<Member> {
		this.logger.log('Mutation: updateMemberByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.memberService.updateMemberByAdmin(input);
	}

	/** UPLOADER **/
	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Mutation((returns) => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		file: FileUpload,
		@Args('target') target: string,
	): Promise<string> {
		this.logger.log('Mutation: imageUploader');
		return await saveImageUpload(file, target);
	}

	@Throttle({ default: { limit: 20, ttl: 60000 } })
	@UseGuards(AuthGuard, GqlThrottlerGuard)
	@Mutation((returns) => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: string,
	): Promise<string[]> {
		this.logger.log('Mutation: imagesUploader');
		assertUploadTarget(target);

		const uploadedImages: string[] = [];
		await Promise.all(
			files.map(async (img: Promise<FileUpload>, index: number): Promise<void> => {
				try {
					uploadedImages[index] = await saveImageUpload(await img, target);
				} catch (err: any) {
					this.logger.warn(`imagesUploader: file ${index} skipped (${err?.message})`);
				}
			}),
		);
		return uploadedImages.filter(Boolean);
	}

	@Roles(MemberType.AGENT, MemberType.ADMIN)
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@UseGuards(RolesGuard, GqlThrottlerGuard)
	@Mutation((returns) => String)
	public async modelUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		file: FileUpload,
	): Promise<string> {
		this.logger.log('Mutation: modelUploader');
		return await saveModelUpload(file);
	}
}
