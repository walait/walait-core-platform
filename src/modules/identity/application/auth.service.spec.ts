import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { DataSource } from 'typeorm';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';

// -------------------- mocks -------------------- //
const userService = {
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  existsByEmail: vi.fn(),
  toResponse: vi.fn(),
};

const sessionService = {
  getActiveByUser: vi.fn(),
  create: vi.fn(),
  updateWithNewTokens: vi.fn(),
  getActiveSessionById: vi.fn(),
  verifyTokenHash: vi.fn(),
  toResponse: vi.fn(),
  revokeSession: vi.fn(),
};

const tokenService = {
  decodePayload: vi.fn(),
  verifyRefreshToken: vi.fn(),
  generateToken: vi.fn(),
  generateSessionSecret: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
};

const passwordService = {
  checkPassword: vi.fn(),
  hashPassword: vi.fn(),
};

const configService = {
  get: vi.fn(),
};

const eventBus = {
  send: vi.fn(),
};

// DataSource mock con transacción "passthrough"
const dataSource = {
  transaction: vi.fn(async (cb) => cb({ getRepository: vi.fn() })),
};

// ------------------ inicio tests ------------------ //
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: UserService, useValue: userService },
        { provide: SessionService, useValue: sessionService },
        { provide: TokenService, useValue: tokenService },
        { provide: PasswordService, useValue: passwordService },
        { provide: ConfigService, useValue: configService },
        { provide: 'EVENT_BUS', useValue: eventBus },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  // ---------- login ---------- //
  describe('login', () => {
    it('should throw if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(
        service.signIn(
          { email: 'test@test.com', password: '1234' },
          { ipAddress: '', userAgent: '' },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if password is invalid', async () => {
      userService.findByEmail.mockResolvedValue({ id: 'user1', is_email_verified: true });
      passwordService.checkPassword.mockResolvedValue(false);
      await expect(
        service.signIn(
          { email: 'test@test.com', password: 'wrong' },
          { ipAddress: '', userAgent: '' },
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user, session and token data', async () => {
      const user = { id: 'user1', email: 'test@test.com', is_email_verified: true };
      const session = { id: 'sess1' };
      const tokens = {
        access_token: 'access',
        refresh_token: 'refresh',
        sessionSecret: 'secret',
        expires_at: new Date(),
      };

      userService.findByEmail.mockResolvedValue(user);
      passwordService.checkPassword.mockResolvedValue(true);
      sessionService.getActiveByUser.mockResolvedValue({
        ip_address: '1.2.3.4',
        user_agent: 'Agent',
      });
      sessionService.create.mockResolvedValue(session);
      eventBus.send.mockImplementation((pattern) => {
        if (pattern === 'membership.getMembershipAndOrgById') {
          return of({ organization: { id: 'org' }, role: 'admin' });
        }
        return of(true);
      });
      tokenService.generateAccessToken.mockResolvedValue(tokens.access_token);
      tokenService.generateRefreshToken.mockResolvedValue(tokens.refresh_token);
      tokenService.generateSessionSecret.mockReturnValue(tokens.sessionSecret);
      sessionService.toResponse.mockReturnValue({ ...tokens, id: session.id });
      userService.toResponse.mockReturnValue({ id: user.id });

      const result = await service.signIn(
        { email: user.email, password: 'pass' },
        { ipAddress: '1.2.3.4', userAgent: 'Agent' },
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result.require_email_verification).toBe(false);
    });
  });

  // ---------- signUp ---------- //
  describe('signUp', () => {
    const baseInput: Record<string, unknown> = {
      email: 'test@test.com',
      password: '1234',
      organization_id: 'org1',
      role: 'admin',
      is_global_admin: false,
      global_admin_key: '',
      first_name: 'Test',
      last_name: 'User',
      avatar_url: null,
      metadata: null,
    };

    it('should throw if email exists', async () => {
      userService.existsByEmail.mockResolvedValue(true);
      configService.get.mockImplementation((key: string) =>
        key === 'ALLOW_GLOBAL_SIGN_UP' ? true : 'key',
      );
      await expect(service.signUp(baseInput, { ipAddress: '', userAgent: '' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw if no organization_id', async () => {
      userService.existsByEmail.mockResolvedValue(false);
      configService.get.mockImplementation((key: string) =>
        key === 'ALLOW_GLOBAL_SIGN_UP' ? true : 'key',
      );
      await expect(
        service.signUp(
          { ...baseInput, organization_id: undefined },
          { ipAddress: '', userAgent: '' },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if global admin key is invalid', async () => {
      userService.existsByEmail.mockResolvedValue(false);
      configService.get.mockImplementation((key: string) =>
        key === 'ALLOW_GLOBAL_SIGN_UP' ? false : 'key',
      );
      await expect(
        service.signUp({ ...baseInput, is_global_admin: true }, { ipAddress: '', userAgent: '' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create user, membership and assign role', async () => {
      userService.existsByEmail.mockResolvedValue(false);
      userService.createUser.mockResolvedValue({ id: 'user1' });
      sessionService.create.mockResolvedValue({ id: 'sess1' });
      configService.get.mockImplementation((key: string) =>
        key === 'ALLOW_GLOBAL_SIGN_UP' ? true : 'key',
      );
      eventBus.send.mockImplementation((pattern) => {
        if (pattern === 'organizations.getById') {
          return of({ id: 'org1', is_active: true, slug: 'org', domain: 'example.com' });
        }
        if (pattern === 'membership.createMembership') {
          return of({
            id: 'mem1',
            organization: { id: 'org1', slug: 'org', domain: 'example.com' },
          });
        }
        if (pattern === 'user-roles.createUserRole') {
          return of({});
        }
        if (pattern === 'email.verification_requested') {
          return of({});
        }
        return of(true);
      });
      userService.toResponse.mockReturnValue({ id: 'user1' });

      const result = await service.signUp(baseInput, { ipAddress: '', userAgent: '' });

      expect(result.user).toEqual({ id: 'user1' });
    });
  });

  // ---------- refreshToken ---------- //
  describe('refreshToken', () => {
    it('should throw if session is not found', async () => {
      tokenService.decodePayload.mockReturnValue({ sid: 'sess1' });
      sessionService.getActiveSessionById.mockResolvedValue(null);
      await expect(service.refreshToken({ refresh_token: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if token is invalid or expired', async () => {
      const session = {
        id: 'sess1',
        session_secret: 'sec',
        expires_at: new Date(Date.now() - 1000),
        user: { id: 'u', email: 'a' },
      };
      sessionService.getActiveSessionById.mockResolvedValue(session);
      tokenService.decodePayload.mockReturnValue({ sid: 'sess1' });
      tokenService.verifyRefreshToken.mockImplementation(() => {
        throw new Error();
      });

      await expect(service.refreshToken({ refresh_token: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens', async () => {
      const session = {
        id: 'sess1',
        session_secret: 'secret',
        expires_at: new Date(Date.now() + 1000),
        user: { id: 'u1', email: 'x', first_name: 'f', last_name: 'l', is_email_verified: true },
      } as {
        id: string;
        session_secret: string;
        expires_at: Date;
        user: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          is_email_verified: boolean;
        };
      };

      tokenService.decodePayload.mockReturnValue({ sid: 'sess1', sub: 'u1' });
      sessionService.getActiveSessionById.mockResolvedValue(session);
      tokenService.verifyRefreshToken.mockResolvedValue(true);
      sessionService.verifyTokenHash.mockResolvedValue(true);
      eventBus.send.mockImplementation((pattern) => {
        if (pattern === 'membership.getMembershipAndOrgById') {
          return of({ organization: { id: 'org', slug: 'org', domain: undefined }, role: 'admin' });
        }
        return of(true);
      });
      tokenService.generateAccessToken.mockResolvedValue('acc');
      tokenService.generateRefreshToken.mockResolvedValue('ref');
      tokenService.generateSessionSecret.mockReturnValue('secret');
      sessionService.toResponse.mockReturnValue({ id: 'sess1' });
      userService.toResponse.mockReturnValue({ id: 'u1' });

      const result = await service.refreshToken({ refresh_token: 'abc' });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
    });
  });

  // ---------- logout ---------- //
  describe('logout', () => {
    it('should revoke session', async () => {
      sessionService.revokeSession.mockResolvedValue(true);
      const result = await service.logout('sess1');
      expect(result).toBe(true);
    });
  });
});
