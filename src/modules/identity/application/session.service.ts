import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { verify } from 'argon2';
import { EntityManager, type Repository } from 'typeorm';
import { Session } from '../domain/model/session.entity';

@Injectable()
export class SessionService {
  constructor(@InjectRepository(Session) private readonly repo: Repository<Session>) {}

  async create(userId: string, data: Partial<Session>) {
    const session = this.repo.create({
      ...data,
      user: { id: userId },
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return this.repo.save(session);
  }

  async updateWithNewTokens(sessionId: string, hashedToken: string, secret: string, ttlMs: number) {
    const expiresAt = new Date(Date.now() + ttlMs);
    return this.repo.update(sessionId, {
      refresh_token: hashedToken,
      expires_at: expiresAt,
      session_secret: secret,
      revoked_at: undefined,
    });
  }

  async getActiveSessionById(id: string) {
    return this.repo.findOne({
      where: { id, revoked_at: undefined },
      relations: ['user'],
    });
  }
  getActiveByUser(userId: string) {
    return this.repo.findOne({
      where: { user: { id: userId }, revoked_at: undefined },
    });
  }

  getAllActiveSessions(userId: string) {
    return this.repo.find({
      where: { revoked_at: undefined, user: { id: userId } },
      relations: ['user'],
    });
  }

  verifyTokenHash(session: Session, token: string) {
    return verify(session.refresh_token, token);
  }

  toResponse(
    session: Session,
    tokens: { access_token: string; refresh_token: string; expires_at: Date },
  ) {
    return {
      id: session.id,
      expires_at: tokens.expires_at,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  revokeSession(sessionId: string) {
    return this.repo.update(sessionId, {
      revoked_at: new Date(),
    });
  }

  deleteSessionByUserId(userId: string) {
    return this.repo.delete({
      user: { id: userId },
    });
  }
}
