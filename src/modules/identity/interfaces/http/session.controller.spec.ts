import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SessionService } from '../../application/session.service';
import { TokenService } from '../../application/token.service';
import { UserService } from '../../application/user.service';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { SessionController } from './session.controller';

describe('SessionController', () => {
  let controller: SessionController;
  let userService: jest.Mocked<UserService>;
  let sessionService: jest.Mocked<SessionService>;

  const user = { id: 'user-1', email: 'test@example.com' };
  const session = { id: 'sess-1', user, ip_address: '127.0.0.1', user_agent: 'test-agent' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: jest.fn(),
            toResponse: jest.fn().mockReturnValue({ id: user.id }),
          },
        },

        {
          provide: TokenService,
          useValue: {
            verifyAccessToken: jest.fn().mockResolvedValue(true),
            decodePayload: jest.fn().mockReturnValue({ sub: 'user-1' }),
          },
        },
        {
          provide: SessionService,
          useValue: {
            getAllActiveSessions: jest.fn(),
            getActiveSessionById: jest.fn(),
            revokeSession: jest.fn(),
            toResponse: jest.fn().mockReturnValue({ id: session.id }),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(SessionController);
    userService = module.get(UserService);
    sessionService = module.get(SessionService);
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    const req = { user: { sub: user.id } };

    it('should return sessions if found', async () => {
      userService.findById.mockResolvedValue(user as any);
      sessionService.getAllActiveSessions.mockResolvedValue([session as any]);

      const result = await controller.getSessions(req as any);

      expect(result).toEqual({
        message: 'Active sessions retrieved successfully',
        user: { id: user.id },
        sessions: [session],
      });
    });

    it('should throw if user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.getSessions(req as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw if no sessions found', async () => {
      userService.findById.mockResolvedValue(user as any);
      sessionService.getAllActiveSessions.mockResolvedValue([]);

      await expect(controller.getSessions(req as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSession', () => {
    const req = { user: { sub: user.id, sid: session.id } };

    it('should revoke session successfully', async () => {
      userService.findById.mockResolvedValue(user as any);
      sessionService.getActiveSessionById.mockResolvedValue(session as any);

      const result = await controller.deleteSession(req as any, session.id);

      expect(sessionService.revokeSession).toHaveBeenCalledWith(session.id);
      expect(result).toEqual({
        message: 'Session revoked successfully',
        session: { id: session.id },
      });
    });

    it('should throw if user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.deleteSession(req as any, session.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if session not found', async () => {
      userService.findById.mockResolvedValue(user as any);
      sessionService.getActiveSessionById.mockResolvedValue(null);

      await expect(controller.deleteSession(req as any, session.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
