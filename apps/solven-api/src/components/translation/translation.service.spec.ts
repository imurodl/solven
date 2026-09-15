import { TranslationService } from './translation.service';

describe('TranslationService', () => {
	const env = process.env;
	let service: TranslationService;

	beforeEach(() => {
		process.env = { ...env };
		service = new TranslationService();
	});
	afterEach(() => {
		process.env = env;
		jest.restoreAllMocks();
	});

	it('clean() keeps only supported locales with a title and defaults desc', () => {
		expect(
			service.clean({ en: { title: ' A ', desc: ' d ' }, kr: { title: '' }, ru: { title: 'Б' }, xx: { title: 'no' } }),
		).toEqual({ en: { title: 'A', desc: 'd' }, ru: { title: 'Б', desc: '' } });
		expect(service.clean({ kr: { title: '' } })).toBeNull();
		expect(service.clean('garbage')).toBeNull();
	});

	it('returns null without any provider key (feature disabled)', async () => {
		delete process.env.GROQ_API_KEY;
		delete process.env.GEMINI_API_KEY;
		expect(await service.translate('car', 'Hyundai Sonata', 'nice')).toBeNull();
	});

	it('uses Groq when configured and parses its JSON reply', async () => {
		process.env.GROQ_API_KEY = 'k';
		const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
			ok: true,
			json: async () => ({
				choices: [
					{
						message: {
							content: JSON.stringify({
								en: { title: 'Sonata', desc: 'nice' },
								uz: { title: 'Sonata', desc: 'yaxshi' },
							}),
						},
					},
				],
			}),
		} as any);
		const result = await service.translate('car', 'Sonata', 'nice');
		expect(fetchMock.mock.calls[0][0]).toContain('groq.com');
		expect(result).toEqual({ en: { title: 'Sonata', desc: 'nice' }, uz: { title: 'Sonata', desc: 'yaxshi' } });
	});

	it('falls back to Gemini when Groq fails, and never throws', async () => {
		process.env.GROQ_API_KEY = 'k';
		process.env.GEMINI_API_KEY = 'g';
		jest
			.spyOn(global, 'fetch' as any)
			.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' } as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					candidates: [{ content: { parts: [{ text: JSON.stringify({ kr: { title: '소나타', desc: '' } }) }] } }],
				}),
			} as any);
		expect(await service.translate('car', 'Sonata')).toEqual({ kr: { title: '소나타', desc: '' } });

		jest.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('network'));
		expect(await service.translate('car', 'Sonata')).toBeNull();
	});
});
