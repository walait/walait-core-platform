import { JwtAuthGuard } from '@/services/identity-ms/guards/jwt.guard';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { VerificationService } from '../../application/verification.service';
import { VerificationController } from './verification.controller';

describe('VerificationController', () => {
  let controller: VerificationController;

  const verificationService = {
    getEmailVerificationToken: vi.fn(),
    createToken: vi.fn(),
  };

  const eventBus = {
    send: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [
        { provide: VerificationService, useValue: verificationService },
        { provide: 'EVENT_BUS', useValue: eventBus },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(VerificationController);
    vi.clearAllMocks();
  });

  describe('verifyEmail', () => {
    const tokenPayload = {
      user_id: 'user-1',
      expires_at: new Date(Date.now() + 3_600_000),
    };

    it('verifies email and returns redirect data', async () => {
      verificationService.getEmailVerificationToken.mockResolvedValue({ token: tokenPayload });
      eventBus.send.mockImplementation((pattern) => {
        if (pattern === 'user.getById') {
          return of({ id: 'user-1', is_email_verified: false });
        }
        if (pattern === 'organizations.getOrganizationById') {
          return of({ domain: 'example.com' });
        }
        return of(true);
      });

      const result = await controller.verifyEmail('abc123', 'org-123');

      expect(eventBus.send).toHaveBeenNthCalledWith(1, 'user.getById', {
        user_id: 'user-1',
      });
      expect(eventBus.send).toHaveBeenNthCalledWith(3, 'organizations.getOrganizationById', {
        organization_id: 'org-123',
      });
      expect(result).toEqual({ url: 'https://example.com', status: 3012 });
    });

    it('throws BadRequest when token is missing', async () => {
      verificationService.getEmailVerificationToken.mockResolvedValue({ token: null });
      await expect(controller.verifyEmail('invalid', 'org-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest when user is not found', async () => {
      verificationService.getEmailVerificationToken.mockResolvedValue({ token: tokenPayload });
      eventBus.send.mockReturnValueOnce(of(null));

      await expect(controller.verifyEmail('abc123', 'org-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest when email is already verified', async () => {
      verificationService.getEmailVerificationToken.mockResolvedValue({ token: tokenPayload });
      eventBus.send.mockReturnValueOnce(of({ id: 'user-1', is_email_verified: true }));

      await expect(controller.verifyEmail('abc123', 'org-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerification', () => {
    const reqFactory = (user: { sub: string } | null) => ({ user });

    it('resends verification and returns token data', async () => {
      const existingUser = { id: 'user-1', is_email_verified: false };
      eventBus.send.mockReturnValueOnce(of(existingUser)).mockReturnValueOnce(of('jwt-token'));
      verificationService.createToken.mockResolvedValue({
        token: 'jwt-token',
        expires_at: new Date(),
      });

      const result = await controller.resendVerification(reqFactory({ sub: existingUser.id }));

      expect(eventBus.send).toHaveBeenNthCalledWith(1, 'user.user.getById', {
        user_id: existingUser.id,
      });
      expect(eventBus.send).toHaveBeenNthCalledWith(2, 'token.generateToken', {
        userId: existingUser.id,
        type: 'email_verification',
        expiration_at: expect.any(Number),
        secret: process.env.EMAIL_VERIFICATION_SECRET,
        expiration: '1h',
      });
      expect(verificationService.createToken).toHaveBeenCalledWith(
        existingUser.id,
        'jwt-token',
        expect.any(Date),
      );
      expect(result).toEqual({
        token: 'jwt-token',
        expires_at: expect.any(Date),
      });
    });

    it('throws BadRequest when req.user is missing', async () => {
      await expect(controller.resendVerification(reqFactory(null))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest when user is not found', async () => {
      eventBus.send.mockReturnValueOnce(of(null));
      await expect(controller.resendVerification(reqFactory({ sub: 'ghost' }))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequest when email already verified', async () => {
      eventBus.send.mockReturnValueOnce(of({ id: 'user-1', is_email_verified: true }));
      await expect(controller.resendVerification(reqFactory({ sub: 'user-1' }))).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
