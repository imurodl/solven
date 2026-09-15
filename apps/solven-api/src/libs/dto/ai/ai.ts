import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { CarColor, CarType } from '../../enums/car.enum';
import { Car } from '../car/car';

@ObjectType()
export class CarPhotoAnalysis {
	@Field(() => String, { nullable: true })
	brand?: string;

	@Field(() => String, { nullable: true })
	model?: string;

	@Field(() => CarType, { nullable: true })
	bodyType?: CarType;

	@Field(() => CarColor, { nullable: true })
	color?: CarColor;

	@Field(() => Int, { nullable: true })
	yearGuess?: number;

	@Field(() => Float)
	confidence: number;

	@Field(() => String)
	notes: string;

	@Field(() => [Car])
	matchedCars: Car[];
}

@ObjectType()
export class CarPriceEstimate {
	@Field(() => Int)
	estimate: number;

	@Field(() => Int)
	low: number;

	@Field(() => Int)
	high: number;

	@Field(() => Int)
	sampleSize: number;

	@Field(() => String)
	reasoning: string;

	// FAIR | GOOD_DEAL | OVERPRICED | UNKNOWN when askingPrice is provided
	@Field(() => String, { nullable: true })
	verdict?: string;
}

@ObjectType()
export class CarDescriptionResult {
	@Field(() => String)
	title: string;

	@Field(() => String)
	desc: string;
}

@ObjectType()
export class AiStatus {
	@Field(() => Boolean)
	photoFinder: boolean;

	@Field(() => Boolean)
	priceCheck: boolean;

	@Field(() => Boolean)
	descriptionWriter: boolean;

	@Field(() => Int)
	remainingToday: number;
}
