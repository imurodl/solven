import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	CAR = 'CAR',
	SERVICE_JOB = 'SERVICE_JOB',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
