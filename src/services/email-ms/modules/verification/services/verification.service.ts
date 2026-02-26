import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, LessThan, Repository } from 'typeorm';
import { EmailVerificationToken } from '../model/email-verification-token.entity';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationRepository: Repository<EmailVerificationToken>,
  ) {}

  async createToken(userId: string, token: string, expiresAt: Date) {
    const newToken = this.emailVerificationRepository.create({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });
    return this.emailVerificationRepository.save(newToken);
  }

  async findToken(token: string) {
    return this.emailVerificationRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async deleteToken(token: EmailVerificationToken) {
    return this.emailVerificationRepository.delete({ id: token.id });
  }

  async deleteTokensByUserId(userId: string) {
    await this.emailVerificationRepository.delete({ user_id: userId });
  }

  async findTokensByUserId(userId: string) {
    return this.emailVerificationRepository.find({
      where: { user_id: userId },
      relations: ['user'],
    });
  }

  async deleteExpiredTokens() {
    const now = new Date();
    return this.emailVerificationRepository.delete({ expires_at: LessThan(now) });
  }

  async deleteAllTokens() {
    return this.emailVerificationRepository.clear();
  }

  async getEmailVerificationToken(token: string) {
    const existToken = await this.findToken(token);

    if (!existToken) {
      throw new NotFoundException('Invalid email verification token');
    }
    if (existToken.expires_at < new Date()) {
      await this.deleteToken(existToken);
      throw new NotFoundException('Email verification token expired');
    }

    return { token: existToken };
  }
}
