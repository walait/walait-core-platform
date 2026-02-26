import { Session } from '@/modules/identity/domain/model/session.entity';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { verify } from 'argon2';
import type { Repository } from 'typeorm';
import { type Mock, vi } from 'vitest';
import { SessionService } from './session.service';

vi.mock('argon2', () => ({
  verify: vi.fn(),
}));

describe('SessionService', () => {
  let service: SessionService;
  let repo: { [K in keyof Repository<Session>]: Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            update: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    repo = module.get(getRepositoryToken(Session));
  });

  it('should create a session', async () => {
    const userId = 'user-id';
    const data = { ip: '127.0.0.1' } as Partial<Session>;
    const session = { id: 'session-id', ...data, user: { id: userId } } as Session;

    repo.create.mockReturnValue(session);
    repo.save.mockResolvedValue(session);

    const result = await service.create(userId, data);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: userId },
        ip: '127.0.0.1',
      }),
    );
    expect(repo.save).toHaveBeenCalledWith(session);
    expect(result).toEqual(session);
  });

  it('should update session with new tokens', async () => {
    const sessionId = 'session-id';
    const hashedToken = 'hashed-token';
    const secret = 'session-secret';
    const ttlMs = 1000;

    const result = await service.updateWithNewTokens(sessionId, hashedToken, secret, ttlMs);

    expect(repo.update).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({
        refresh_token: hashedToken,
        session_secret: secret,
        revoked_at: undefined,
      }),
    );
    expect(result).toBeUndefined(); // update() returns void or UpdateResult
  });

  it('should get active session by id', async () => {
    const sessionId = 'session-id';
    const session = { id: sessionId, revoked_at: null } as Session;

    repo.findOne.mockResolvedValue(session);

    const result = await service.getActiveSessionById(sessionId);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: sessionId, revoked_at: undefined },
      relations: ['user'],
    });
    expect(result).toEqual(session);
  });

  it('should get active session by user ID', async () => {
    const userId = 'user-id';
    const session = { id: 'session-id' } as Session;

    repo.findOne.mockResolvedValue(session);

    const result = await service.getActiveByUser(userId);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { user: { id: userId }, revoked_at: undefined },
    });
    expect(result).toEqual(session);
  });

  it('should get all active sessions for a user', async () => {
    const userId = 'user-id';
    const sessions = [{ id: '1' }, { id: '2' }] as Session[];

    repo.find.mockResolvedValue(sessions);

    const result = await service.getAllActiveSessions(userId);
    expect(repo.find).toHaveBeenCalledWith({
      where: { revoked_at: undefined, user: { id: userId } },
      relations: ['user'],
    });
    expect(result).toEqual(sessions);
  });

  it('should verify token hash', async () => {
    const session = { refresh_token: 'hashed' } as Session;
    const token = 'plain-token';

    (verify as Mock).mockResolvedValue(true);

    const result = await service.verifyTokenHash(session, token);
    expect(verify).toHaveBeenCalledWith('hashed', token);
    expect(result).toBe(true);
  });

  it('should return session response object', () => {
    const session = { id: 'session-id' } as Session;
    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: new Date(),
    };

    const result = service.toResponse(session, tokens);
    expect(result).toEqual({
      id: 'session-id',
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: tokens.expires_at,
    });
  });

  it('should revoke session', async () => {
    const sessionId = 'session-id';

    await service.revokeSession(sessionId);
    expect(repo.update).toHaveBeenCalledWith(sessionId, {
      revoked_at: expect.any(Date),
    });
  });
});
