import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MemberType } from '../../libs/enums/member.enum';

describe('AuthService', () => {
	let service: AuthService;
	let jwtService: JwtService;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
			providers: [AuthService],
		}).compile();

		service = moduleRef.get<AuthService>(AuthService);
		jwtService = moduleRef.get<JwtService>(JwtService);
	});

	describe('password hashing', () => {
		it('produces a hash that differs from the plaintext', async () => {
			const hash = await service.hashPassword('s3cret-pass');
			expect(hash).not.toEqual('s3cret-pass');
			expect(hash.length).toBeGreaterThan(20);
		});

		it('verifies a correct password against its hash', async () => {
			const hash = await service.hashPassword('s3cret-pass');
			await expect(service.comparePasswords('s3cret-pass', hash)).resolves.toBe(true);
		});

		it('rejects an incorrect password', async () => {
			const hash = await service.hashPassword('s3cret-pass');
			await expect(service.comparePasswords('wrong-pass', hash)).resolves.toBe(false);
		});
	});

	describe('createToken', () => {
		it('embeds member fields but strips password and refreshToken', async () => {
			const member: any = {
				_id: 'member-1',
				memberNick: 'max',
				memberType: MemberType.USER,
				memberPassword: 'HASHED_PASSWORD',
				refreshToken: 'SOME_REFRESH_TOKEN',
			};

			const token = await service.createToken(member);
			const decoded: any = jwtService.decode(token);

			expect(decoded.memberNick).toBe('max');
			expect(decoded.memberType).toBe(MemberType.USER);
			expect(decoded.memberPassword).toBeUndefined();
			expect(decoded.refreshToken).toBeUndefined();
		});
	});
});
