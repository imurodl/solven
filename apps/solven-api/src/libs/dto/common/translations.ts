import { Field, ObjectType } from '@nestjs/graphql';

// Machine-translated copy of a title/description pair, one entry per locale.
// Stored as a Mixed sub-document; exposed as a fixed object type so clients
// can select the locales they need.
@ObjectType()
export class TranslatedText {
	@Field(() => String, { nullable: true })
	title?: string;

	@Field(() => String, { nullable: true })
	desc?: string;
}

@ObjectType()
export class Translations {
	@Field(() => TranslatedText, { nullable: true })
	en?: TranslatedText;

	@Field(() => TranslatedText, { nullable: true })
	kr?: TranslatedText;

	@Field(() => TranslatedText, { nullable: true })
	ru?: TranslatedText;

	@Field(() => TranslatedText, { nullable: true })
	uz?: TranslatedText;
}
