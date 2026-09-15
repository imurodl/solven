import { registerEnumType } from '@nestjs/graphql';

export enum ReviewStatus {
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(ReviewStatus, { name: 'ReviewStatus' });

export enum ReviewReaction {
	LIKE = 'LIKE',
	DISLIKE = 'DISLIKE',
}
registerEnumType(ReviewReaction, { name: 'ReviewReaction' });
