import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { decode } from 'jsonwebtoken';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(payload: Record<string, any>) {
    return this.generateToken(payload, process.env.JWT_SECRET, '15m');
  }

  generateToken(payload: Record<string, any>, secret: string, expiresIn: string) {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  generateRefreshToken(payload: Record<string, any>, secret: string) {
    return this.generateToken(payload, secret, '7d');
  }

  verifyRefreshToken(token: string, secret: string) {
    return this.jwtService.verifyAsync(token, { secret });
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET,
    });
  }

  decodePayload<T>(token: string): T {
    return decode(token) as T;
  }

  generateSessionSecret(): string {
    return randomBytes(32).toString('hex');
  }
}
