import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	noticeTitle: string;

	@IsNotEmpty()
	@IsString()
	@Field(() => String)
	noticeContent: string;

	@IsOptional()
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;
}

@InputType()
export class NoticeUpdate {
	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@IsString()
	@Field(() => String, { nullable: true })
	noticeContent?: string;

	@IsOptional()
	@IsEnum(NoticeStatus)
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@IsEnum(NoticeCategory)
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;
}