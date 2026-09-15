import { LoggingInterceptor } from './Logging.interceptor';

describe('LoggingInterceptor redact', () => {
	const interceptor = new LoggingInterceptor();

	it('masks password-bearing keys at any depth without mutating the source', () => {
		const input = {
			operationName: 'login',
			variables: { input: { memberNick: 'max', memberPassword: 'secret' } },
		};

		const output = (interceptor as any).redact(input);

		expect(output.variables.input.memberPassword).toBe('[REDACTED]');
		expect(output.variables.input.memberNick).toBe('max');
		expect(output.operationName).toBe('login');
		// original object stays untouched
		expect(input.variables.input.memberPassword).toBe('secret');
	});

	it('handles arrays and primitives', () => {
		const output = (interceptor as any).redact([{ password: 'x' }, 'plain', 5]);

		expect(output[0].password).toBe('[REDACTED]');
		expect(output[1]).toBe('plain');
		expect(output[2]).toBe(5);
	});

	it('survives circular references and unwraps mongoose-like documents', () => {
		const circular: any = { name: 'a' };
		circular.self = circular;
		const docLike = { toObject: () => ({ carTitle: 'x', memberPassword: 'p', when: new Date(0) }) };

		const output = (interceptor as any).redact({ circular, docLike });

		expect(output.circular.self).toBe('[Circular]');
		expect(output.docLike.carTitle).toBe('x');
		expect(output.docLike.memberPassword).toBe('[REDACTED]');
		expect(output.docLike.when).toBeInstanceOf(Date);
	});

	it('bounds recursion depth', () => {
		let deep: any = { v: 1 };
		for (let i = 0; i < 20; i++) deep = { child: deep };
		expect(() => (interceptor as any).redact(deep)).not.toThrow();
	});
});
