import { JwtAuthGuard } from '@/services/identity-ms/guards/jwt.guard';
import { AuthService } from '@/services/identity-ms/modules/auth/services/auth.service';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
// src/apps/auth/auth.controller.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { vi } from 'vitest';
import { AuthController } from './auth.controller';

// ──────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────
const authServiceMock = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
};

const configServiceMock = {
  get: vi.fn(),
};

// ──────────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────────
describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(AuthController);
    vi.clearAllMocks();
  });

  // ------------------------------------------------ signIn
  it('signIn llama AuthService.signIn con dto y clientInfo', async () => {
    const dto = { email: 'a@test.com', password: '123' } as {
      email: string;
      password: string;
    };
    const info = { ipAddress: '1.1.1.1', userAgent: 'jest' };
    const response = {
      cookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as unknown as Response;
    const result = { session: { refresh_token: 'rt' } };
    authServiceMock.signIn.mockResolvedValue(result);

    await controller.signIn(dto, info, response);

    expect(authServiceMock.signIn).toHaveBeenCalledWith(dto, info);
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'rt',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(result);
  });

  // ------------------------------------------------ signUp
  it('signUp llama AuthService.signUp', async () => {
    const dto = {
      email: 'b@test.com',
      password: 'p',
      organization_id: 'org',
      role: 'member',
    } as {
      email: string;
      password: string;
      organization_id: string;
      role: string;
    };
    const info = { ipAddress: '2.2.2.2', userAgent: 'jest' };
    authServiceMock.signUp.mockResolvedValue('signed');

    const res = await controller.signUp(dto, info);

    expect(authServiceMock.signUp).toHaveBeenCalledWith(dto, info);
    expect(res).toBe('signed');
  });

  // ------------------------------------------------ refresh
  it('refresh delega en AuthService.refreshToken', async () => {
    const req = { cookies: { refresh_token: 'rt' } } as unknown as Request;
    authServiceMock.refreshToken.mockResolvedValue('refreshed');

    const res = await controller.refresh(req, {} as unknown as Response);

    expect(authServiceMock.refreshToken).toHaveBeenCalledWith('rt');
    expect(res).toEqual({ accessToken: 'refreshed' });
  });

  // ------------------------------------------------ logout
  it('logout delega en AuthService.logout usando req.user.sid', async () => {
    const sid = 'sess-1';
    authServiceMock.logout.mockResolvedValue(undefined);

    const response = { clearCookie: vi.fn() } as unknown as Response;
    const result = await controller.logout({ user: { sid } } as unknown as Request, response);

    expect(authServiceMock.logout).toHaveBeenCalledWith(sid);
    expect(response.clearCookie).toHaveBeenCalledWith('refresh_token', { path: '/' });
    expect(result).toBeUndefined();
  });

  // ------------------------------------------------ metadata: JwtAuthGuard en logout
  it('logout tiene el guard JwtAuthGuard aplicado', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, controller.logout);
    expect(guards).toContain(JwtAuthGuard);
  });
});
