import { registerEnumType } from '@nestjs/graphql';

export enum MessageStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(MessageStatus, { name: 'MessageStatus' });

export enum ConversationKind {
	CAR = 'CAR',
	SERVICE = 'SERVICE',
}
registerEnumType(ConversationKind, { name: 'ConversationKind' });
