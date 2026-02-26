import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';

@Injectable()
export class PasswordService {
  private readonly secret: Buffer;
  constructor() {
    const rawSecret = process.env.HASH_PASSWORD_TOKEN;
    if (!rawSecret) {
      throw new Error('HASH_PASSWORD_TOKEN env var is required');
    }

    this.secret = Buffer.from(rawSecret);
  }
  async hashPassword(password: string): Promise<string> {
    return hash(password);
  }

  async checkPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return verify(hashedPassword, plainPassword);
  }
}
