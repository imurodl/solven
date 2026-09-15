import { registerEnumType } from '@nestjs/graphql';

export enum ViewGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	CAR = 'CAR',
	SERVICE_JOB = 'SERVICE_JOB',
}
registerEnumType(ViewGroup, {
	name: 'ViewGroup',
});
