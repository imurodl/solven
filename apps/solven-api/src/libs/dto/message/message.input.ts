import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';

@InputType()
export class SendMessageInput {
	@IsNotEmpty()
	@Field(() => String)
	carId: string;

	@IsNotEmpty()
	@Length(1, 2000)
	@Field(() => String)
	message: string;

	@IsOptional()
	@Length(0, 60)
	@Field(() => String, { nullable: true })
	name?: string;

	@IsOptional()
	@Length(0, 20)
	@Field(() => String, { nullable: true })
	phone?: string;
}

@InputType()
export class ReplyMessageInput {
	@IsNotEmpty()
	@Field(() => String)
	conversationId: string;

	@IsNotEmpty()
	@Length(1, 2000)
	@Field(() => String)
	message: string;
}

@InputType()
export class SendServiceRequestInput {
	@IsNotEmpty()
	@Field(() => String)
	mechanicId: string;

	@IsNotEmpty()
	@Length(1, 2000)
	@Field(() => String)
	message: string;

	@IsOptional()
	@Length(0, 100)
	@Field(() => String, { nullable: true })
	carInfo?: string;

	@IsOptional()
	@Length(0, 20)
	@Field(() => String, { nullable: true })
	phone?: string;
}
