import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CarDescriptionResult, CarPhotoAnalysis, CarPriceEstimate } from '../../libs/dto/ai/ai';
import { CarDescriptionInput, CarPhotoAnalysisInput, CarPriceEstimateInput } from '../../libs/dto/ai/ai.input';
import { CarColor, CarStatus, CarType } from '../../libs/enums/car.enum';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { CarService } from '../car/car.service';
import { Car } from '../../libs/dto/car/car';
import { CarsInquiry } from '../../libs/dto/car/car.input';

const ANALYZE_TIMEOUT_MS = 60000;
const TEXT_TIMEOUT_MS = 30000;
const MATCH_LIMIT = 8;
const CANDIDATE_POOL = 60;

interface RawPhotoAnalysis {
	brand?: string;
	model?: string;
	bodyType?: string;
	color?: string;
	yearGuess?: number;
	confidence?: number;
	notes?: string;
}

const LOCALE_NAMES: Record<string, string> = { en: 'English', kr: 'Korean', ru: 'Russian', uz: 'Uzbek (Latin)' };

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);

	constructor(
		@InjectModel('Car') private readonly carModel: Model<T>,
		@InjectModel('CarBrand') private readonly carBrandModel: Model<T>,
		private readonly carService: CarService,
	) {}

	private get geminiKey(): string | undefined {
		return process.env.GEMINI_API_KEY || undefined;
	}

	private get geminiModel(): string {
		return process.env.GEMINI_MODEL || 'gemini-3.6-flash';
	}

	public hasVision(): boolean {
		return !!this.geminiKey;
	}

	public hasText(): boolean {
		return !!(process.env.GROQ_API_KEY || this.geminiKey);
	}

	/** PHOTO FINDER **/

	private async brandCatalog(): Promise<{ name: string; models: string[] }[]> {
		const brands = await this.carBrandModel
			.find({ carBrandStatus: { $ne: 'DELETE' } })
			.lean()
			.exec();
		return brands.map((b: T) => ({ name: b.carBrandName, models: b.carBrandModels ?? [] }));
	}

	private buildPhotoPrompt(catalog: { name: string; models: string[] }[], userRequest?: string): string {
		const brandLines = catalog.map((b) => `${b.name}: ${b.models.slice(0, 60).join(', ')}`).join('\n');
		return `You are a car identification assistant for a used-car marketplace in Korea.
Look at the photo and identify the car.

Return JSON with:
- brand: the brand, chosen from this catalog when it fits (uppercase key as listed), otherwise your best guess.
- model: the model name, matching the catalog spelling for that brand when possible.
- bodyType: one of ${Object.values(CarType).join(', ')} (LIGHT = kei/city car, COMPACT, MIDSIZE sedan, LARGE sedan, SUV, TRUCK, OTHER).
- color: one of ${Object.values(CarColor).join(', ')}.
- yearGuess: approximate model year (integer) or null.
- confidence: 0..1 how sure you are about brand+model.
- notes: one short sentence for the user (in English) describing what you see.
${userRequest ? `The user also says: "${userRequest}" — use it to refine the match (budget, transmission, etc.).` : ''}

CATALOG (brand: models):
${brandLines}`;
	}

	private photoSchema() {
		return {
			type: 'OBJECT',
			properties: {
				brand: { type: 'STRING' },
				model: { type: 'STRING' },
				bodyType: { type: 'STRING', enum: Object.values(CarType) },
				color: { type: 'STRING', enum: Object.values(CarColor) },
				yearGuess: { type: 'INTEGER' },
				confidence: { type: 'NUMBER' },
				notes: { type: 'STRING' },
			},
			required: ['brand', 'model', 'confidence', 'notes'],
		};
	}

	private async runGeminiVision(input: CarPhotoAnalysisInput, prompt: string): Promise<RawPhotoAnalysis | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [
							{
								parts: [
									{ text: prompt },
									{ inline_data: { mime_type: input.mimeType || 'image/jpeg', data: input.imageBase64 } },
								],
							},
						],
						generationConfig: {
							response_mime_type: 'application/json',
							response_schema: this.photoSchema(),
							temperature: 0.2,
						},
					}),
					signal: controller.signal,
				},
			);
			if (!res.ok) {
				this.logger.error(`Gemini vision error ${res.status}: ${(await res.text()).slice(0, 200)}`);
				return null;
			}
			const data: any = await res.json();
			const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
			return raw ? (JSON.parse(raw) as RawPhotoAnalysis) : null;
		} catch (err: any) {
			this.logger.error(`Gemini vision failed: ${err?.message || err}`);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	private cleanEnum<E extends string>(value: string | undefined, enumObj: Record<string, E>): E | undefined {
		if (!value) return undefined;
		return Object.values(enumObj).find((v) => v === String(value).toUpperCase());
	}

	private normaliseBrand(raw: string | undefined, catalog: { name: string; models: string[] }[]): string | undefined {
		if (!raw) return undefined;
		const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
		const aliases: Record<string, string> = {
			MERCEDES: 'BENZ',
			MERCEDESBENZ: 'BENZ',
			CHEVY: 'CHEVROLET',
			VW: 'VOLKSWAGEN',
		};
		const wanted = aliases[upper] || upper;
		const hit = catalog.find((b) => b.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === wanted);
		return hit?.name ?? raw.toUpperCase();
	}

	private normaliseModel(
		raw: string | undefined,
		brand: string | undefined,
		catalog: { name: string; models: string[] }[],
	) {
		if (!raw) return undefined;
		const models = catalog.find((b) => b.name === brand)?.models ?? [];
		const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
		const exact = models.find((m) => key(m) === key(raw));
		if (exact) return exact;
		const partial = models.find((m) => key(raw).includes(key(m)) || key(m).includes(key(raw)));
		return partial ?? raw;
	}

	public async analyzeCarPhoto(
		memberId: ObjectId | undefined,
		input: CarPhotoAnalysisInput,
	): Promise<CarPhotoAnalysis> {
		if (!this.hasVision()) throw new BadRequestException(Message.AI_NOT_CONFIGURED);
		const catalog = await this.brandCatalog();
		const raw = await this.runGeminiVision(input, this.buildPhotoPrompt(catalog, input.userRequest));
		if (!raw) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		const brand = this.normaliseBrand(raw.brand, catalog);
		const model = this.normaliseModel(raw.model, brand, catalog);
		const bodyType = this.cleanEnum(raw.bodyType, CarType);
		const color = this.cleanEnum(raw.color, CarColor);
		const yearGuess = Number.isInteger(raw.yearGuess) ? Number(raw.yearGuess) : undefined;

		const matchedCars = await this.findMatchingCars(memberId, brand, model, bodyType, color, yearGuess);
		return {
			brand,
			model,
			bodyType,
			color,
			yearGuess,
			confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)),
			notes: raw.notes || '',
			matchedCars,
		};
	}

	// Brand is a hard filter when present (falls back to body type); model, colour,
	// year proximity score the candidates so a near miss still returns something.
	private async findMatchingCars(
		memberId: ObjectId | undefined,
		brand?: string,
		model?: string,
		bodyType?: CarType,
		color?: CarColor,
		yearGuess?: number,
	): Promise<Car[]> {
		const search: T = {};
		if (brand) search.brandList = [brand];
		else if (bodyType) search.typeList = [bodyType];
		let candidates: Car[] = [];
		try {
			const res = await this.carService.getCars(
				memberId as ObjectId,
				{ page: 1, limit: CANDIDATE_POOL, search } as CarsInquiry,
			);
			candidates = res?.list ?? [];
		} catch {
			candidates = [];
		}
		if (!candidates.length && brand) {
			try {
				const res = await this.carService.getCars(
					memberId as ObjectId,
					{
						page: 1,
						limit: CANDIDATE_POOL,
						search: bodyType ? { typeList: [bodyType] } : {},
					} as CarsInquiry,
				);
				candidates = res?.list ?? [];
			} catch {
				candidates = [];
			}
		}
		const key = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
		const scored = candidates.map((car) => {
			let score = 0;
			if (brand && car.carBrand === brand) score += 3;
			if (model && (key(car.carModel) === key(model) || key(car.carTitle).includes(key(model)))) score += 4;
			if (bodyType && car.carType === bodyType) score += 1;
			if (color && car.carColor === color) score += 1;
			if (yearGuess && car.manufacturedAt) score += Math.max(0, 2 - Math.abs(car.manufacturedAt - yearGuess) / 2);
			return { car, score };
		});
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, MATCH_LIMIT).map((s) => s.car);
	}

	/** PRICE CHECK **/

	// Median of comparable active listings, widening the net until there is data.
	// Works without any AI key; the LLM only adds a sentence of reasoning.
	public async estimateCarPrice(input: CarPriceEstimateInput): Promise<CarPriceEstimate> {
		const brandKey = input.carBrand.toUpperCase();
		const tiers: T[] = [
			{
				carBrand: brandKey,
				carModel: input.carModel,
				manufacturedAt: { $gte: input.manufacturedAt - 2, $lte: input.manufacturedAt + 2 },
			},
			{ carBrand: brandKey, carModel: input.carModel },
			{ carBrand: brandKey, manufacturedAt: { $gte: input.manufacturedAt - 3, $lte: input.manufacturedAt + 3 } },
			{ carBrand: brandKey },
		];
		let comps: T[] = [];
		let tierUsed = -1;
		for (let i = 0; i < tiers.length; i++) {
			comps = await this.carModel
				.find({ carStatus: { $in: [CarStatus.ACTIVE, CarStatus.SOLD] }, ...tiers[i] })
				.select('carPrice carMileage manufacturedAt carModel')
				.limit(200)
				.lean()
				.exec();
			if (comps.length >= 3) {
				tierUsed = i;
				break;
			}
		}
		if (comps.length < 3) {
			return {
				estimate: 0,
				low: 0,
				high: 0,
				sampleSize: comps.length,
				reasoning: 'Not enough comparable listings yet.',
				verdict: 'UNKNOWN',
			};
		}

		// Normalise each comp to the requested mileage/year with simple, explainable factors.
		const adjusted = comps.map((c) => {
			const mileageDelta = (Number(c.carMileage) - input.carMileage) / 10000;
			const yearDelta = input.manufacturedAt - Number(c.manufacturedAt);
			return Number(c.carPrice) * (1 + mileageDelta * 0.015) * (1 + yearDelta * 0.05);
		});
		adjusted.sort((a, b) => a - b);
		const mid = Math.floor(adjusted.length / 2);
		const median = adjusted.length % 2 ? adjusted[mid] : (adjusted[mid - 1] + adjusted[mid]) / 2;
		const q1 = adjusted[Math.floor(adjusted.length * 0.25)];
		const q3 = adjusted[Math.floor(adjusted.length * 0.75)];
		const round = (n: number) => Math.max(0, Math.round(n / 50) * 50);
		const estimate = round(median);
		const low = round(Math.min(q1, median * 0.92));
		const high = round(Math.max(q3, median * 1.08));

		let verdict: string | undefined;
		if (input.askingPrice) {
			if (input.askingPrice < low) verdict = 'GOOD_DEAL';
			else if (input.askingPrice > high) verdict = 'OVERPRICED';
			else verdict = 'FAIR';
		}
		const tierText = ['same model and year', 'same model', 'same brand and year', 'same brand'][tierUsed] ?? 'similar';
		let reasoning = `Based on ${comps.length} ${tierText} listings, adjusted for mileage and year.`;
		if (this.hasText()) {
			const extra = await this.runText(
				`In one or two short sentences (max 45 words), explain to a car buyer why a ${input.manufacturedAt} ${input.carBrand} ${input.carModel} with ${input.carMileage.toLocaleString('en-US')} km${input.carFuelType ? `, ${input.carFuelType.toLowerCase()}` : ''} is estimated at about $${estimate.toLocaleString('en-US')} (range $${low.toLocaleString('en-US')}-$${high.toLocaleString('en-US')}) on a Korean used-car marketplace, given ${comps.length} comparable listings. Plain text, no markdown.`,
			);
			if (extra) reasoning = extra.trim();
		}
		return { estimate, low, high, sampleSize: comps.length, reasoning, verdict };
	}

	/** DESCRIPTION WRITER **/

	public async generateCarDescription(input: CarDescriptionInput): Promise<CarDescriptionResult> {
		if (!this.hasText()) throw new BadRequestException(Message.AI_NOT_CONFIGURED);
		const locale = LOCALE_NAMES[input.locale || 'en'] || 'English';
		const prompt = `You write listings for a used-car marketplace in Korea. Write in ${locale}.
Car: ${input.manufacturedAt} ${input.carBrand} ${input.carModel}
Mileage: ${input.carMileage.toLocaleString('en-US')} km${input.carFuelType ? `\nFuel: ${input.carFuelType}` : ''}${
			input.carTransmission ? `\nTransmission: ${input.carTransmission}` : ''
		}${input.carType ? `\nBody: ${input.carType}` : ''}${input.carOptions?.length ? `\nOptions: ${input.carOptions.join(', ')}` : ''}${
			input.notes ? `\nSeller notes: ${input.notes}` : ''
		}

Return JSON {"title": "...", "desc": "..."}:
- title: max 60 characters, e.g. "2021 Hyundai Sonata DN8 2.0 Premium — one owner" (no emojis).
- desc: 3-5 sentences, honest and specific, mention condition/maintenance/options only if given, end with a friendly invitation to contact or test drive. No markdown, no bullet points, no prices.`;
		const raw = await this.runText(prompt, true);
		if (!raw) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		try {
			const parsed = JSON.parse(raw);
			const title = String(parsed.title || '')
				.trim()
				.slice(0, 100);
			const desc = String(parsed.desc || '')
				.trim()
				.slice(0, 3000);
			if (!desc) throw new Error('empty');
			return { title, desc };
		} catch {
			return { title: '', desc: raw.trim().slice(0, 3000) };
		}
	}

	// Plain text (or JSON when json=true) completion: Groq first, Gemini fallback.
	private async runText(prompt: string, json = false): Promise<string | null> {
		if (process.env.GROQ_API_KEY) {
			const viaGroq = await this.runGroqText(prompt, json);
			if (viaGroq) return viaGroq;
		}
		if (!this.geminiKey) return null;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TEXT_TIMEOUT_MS);
		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ role: 'user', parts: [{ text: prompt }] }],
						generationConfig: { temperature: 0.5, ...(json ? { responseMimeType: 'application/json' } : {}) },
					}),
					signal: controller.signal,
				},
			);
			if (!res.ok) return null;
			const data: any = await res.json();
			return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
		} catch (err: any) {
			this.logger.warn(`Gemini text failed: ${err?.message}`);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	private async runGroqText(prompt: string, json: boolean): Promise<string | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TEXT_TIMEOUT_MS);
		try {
			const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
				body: JSON.stringify({
					model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.5,
					reasoning_effort: 'low',
					...(json ? { response_format: { type: 'json_object' } } : {}),
				}),
				signal: controller.signal,
			});
			if (!res.ok) {
				this.logger.warn(`Groq text error ${res.status}: ${(await res.text()).slice(0, 150)}`);
				return null;
			}
			const data: any = await res.json();
			return data?.choices?.[0]?.message?.content ?? null;
		} catch (err: any) {
			this.logger.warn(`Groq text failed: ${err?.message}`);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}
}
