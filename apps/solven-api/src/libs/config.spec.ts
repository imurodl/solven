import { buildSearchRegex, getAllowedOrigins } from './config';

describe('buildSearchRegex', () => {
	it('matches case-insensitively', () => {
		expect(buildSearchRegex('sonata').test('Hyundai SONATA 2020')).toBe(true);
	});

	it('escapes regex metacharacters so user input cannot inject patterns', () => {
		const re = buildSearchRegex('(a+)+$');
		expect(re.source).toBe('\\(a\\+\\)\\+\\$');
		expect(re.test('(a+)+$')).toBe(true);
		expect(re.test('aaaa')).toBe(false);
	});

	it('caps the pattern length at 100 characters', () => {
		expect(buildSearchRegex('x'.repeat(500)).source.length).toBe(100);
	});

	it('tolerates undefined input', () => {
		expect(buildSearchRegex(undefined as unknown as string).source).toBe('(?:)');
	});
});

describe('getAllowedOrigins', () => {
	const env = process.env;
	afterEach(() => {
		process.env = env;
	});

	it('reads a comma-separated FRONTEND_URL and adds localhost outside production', () => {
		process.env = { ...env, FRONTEND_URL: 'https://a.uz, https://b.uz', NODE_ENV: 'test' };
		expect(getAllowedOrigins()).toEqual([
			'https://a.uz',
			'https://b.uz',
			'http://localhost:3000',
			'http://localhost:3006',
		]);
	});

	it('does not add localhost in production', () => {
		process.env = { ...env, FRONTEND_URL: 'https://solven.uz', NODE_ENV: 'production' };
		expect(getAllowedOrigins()).toEqual(['https://solven.uz']);
	});
});
