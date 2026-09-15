import { Injectable, Logger } from '@nestjs/common';

/**
 * Machine-translates listing / article / notice copy into every site locale.
 * Groq (fast, generous free tier) is primary when GROQ_API_KEY is set; Gemini
 * is the fallback. The service never throws: callers treat null as "no
 * translation" and keep the source text, so a provider outage cannot block a
 * create/update.
 */
export const SUPPORTED_LOCALES = ['en', 'kr', 'ru', 'uz'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_NAMES: Record<SupportedLocale, string> = {
	en: 'English',
	kr: 'Korean',
	ru: 'Russian',
	uz: 'Uzbek (Latin script)',
};

const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const TRANSLATE_TIMEOUT_MS = 20000;

export interface I18nText {
	title: string;
	desc: string;
}
export type TranslationsMap = Partial<Record<SupportedLocale, I18nText>>;

type Kind = 'car' | 'article' | 'notice' | 'service';

const KIND_CONTEXT: Record<Kind, string> = {
	car: 'a used-car marketplace listing (car title and seller description)',
	article: 'a car community blog article (title and body)',
	notice: 'a marketplace notice / FAQ entry (title and body)',
	service: 'a car repair / service showcase (title and description)',
};

@Injectable()
export class TranslationService {
	private readonly logger = new Logger(TranslationService.name);

	public get geminiModel(): string {
		return process.env.GEMINI_MODEL || 'gemini-3.6-flash';
	}

	public isConfigured(): boolean {
		return !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
	}

	private buildPrompt(kind: Kind, title: string, desc: string): string {
		const langs = SUPPORTED_LOCALES.map((k) => `${LOCALE_NAMES[k]} (${k})`).join(', ');
		return `You are a professional translator for ${KIND_CONTEXT[kind]}.
Translate the TITLE and DESCRIPTION into these languages: ${langs}.

STRICT RULES:
- Keep brand names, model names, trim names and proper nouns UNCHANGED (e.g. "Hyundai Sonata DN8 2.0", "BMW X5 xDrive40i").
- Keep numbers, years, mileage, prices, units and measurements as-is.
- Natural, concise, native-sounding translation. Do not add or drop information.
- Korean must read naturally (not textbook), Uzbek uses Latin script.
- If the description is empty, return an empty string for desc.
- Return the English version too (copy/clean the source if it is already English).

TITLE: ${title}
DESCRIPTION: ${desc || ''}`;
	}

	private buildResponseSchema() {
		const item = {
			type: 'OBJECT',
			properties: { title: { type: 'STRING' }, desc: { type: 'STRING' } },
			required: ['title', 'desc'],
		};
		return {
			type: 'OBJECT',
			properties: Object.fromEntries(SUPPORTED_LOCALES.map((k) => [k, item])),
			required: [...SUPPORTED_LOCALES],
		};
	}

	public async translate(kind: Kind, title: string, desc?: string): Promise<TranslationsMap | null> {
		if (!title || !title.trim()) return null;
		if (!this.isConfigured()) return null;
		const prompt = this.buildPrompt(kind, title.trim(), (desc || '').trim());
		if (process.env.GROQ_API_KEY) {
			const viaGroq = await this.runGroq(prompt);
			if (viaGroq) return viaGroq;
			this.logger.warn('Groq translation unavailable, trying Gemini');
		}
		return this.runGemini(prompt);
	}

	private async runGroq(prompt: string): Promise<TranslationsMap | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
		try {
			const jsonShape = SUPPORTED_LOCALES.map((k) => `"${k}": {"title": "...", "desc": "..."}`).join(', ');
			const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
				body: JSON.stringify({
					model: GROQ_MODEL,
					messages: [
						{ role: 'system', content: `Respond ONLY with a JSON object exactly in this shape: {${jsonShape}}` },
						{ role: 'user', content: prompt },
					],
					response_format: { type: 'json_object' },
					temperature: 0.2,
					// Reasoning models spend seconds "thinking" otherwise; translation needs none.
					reasoning_effort: 'low',
				}),
				signal: controller.signal,
			});
			if (!res.ok) {
				this.logger.warn(`Groq translation error ${res.status}: ${(await res.text()).slice(0, 200)}`);
				return null;
			}
			const data: any = await res.json();
			const raw = data?.choices?.[0]?.message?.content;
			return raw ? this.clean(JSON.parse(raw)) : null;
		} catch (err: any) {
			this.logger.warn(`Groq translation failed: ${err?.message || err}`);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	private async runGemini(prompt: string): Promise<TranslationsMap | null> {
		const key = process.env.GEMINI_API_KEY;
		if (!key) return null;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);
		try {
			const res = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${key}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						contents: [{ role: 'user', parts: [{ text: prompt }] }],
						generationConfig: {
							responseMimeType: 'application/json',
							responseSchema: this.buildResponseSchema(),
							temperature: 0.2,
						},
					}),
					signal: controller.signal,
				},
			);
			if (!res.ok) {
				this.logger.warn(`Gemini translation error ${res.status}: ${(await res.text()).slice(0, 200)}`);
				return null;
			}
			const data: any = await res.json();
			const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
			return raw ? this.clean(JSON.parse(raw)) : null;
		} catch (err: any) {
			this.logger.warn(`Gemini translation failed: ${err?.message || err}`);
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	// Keep only known locales with a non-empty title; anything else is dropped.
	public clean(parsed: unknown): TranslationsMap | null {
		if (!parsed || typeof parsed !== 'object') return null;
		const source = parsed as Record<string, { title?: unknown; desc?: unknown }>;
		const out: TranslationsMap = {};
		for (const loc of SUPPORTED_LOCALES) {
			const entry = source[loc];
			if (entry && typeof entry.title === 'string' && entry.title.trim()) {
				out[loc] = { title: entry.title.trim(), desc: typeof entry.desc === 'string' ? entry.desc.trim() : '' };
			}
		}
		return Object.keys(out).length ? out : null;
	}
}
