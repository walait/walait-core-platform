import { randomBytes } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { type SignOptions, decode } from "jsonwebtoken";

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(payload: Record<string, unknown>) {
    const secret = process.env.JWT_SECRET ?? "";
    return this.generateToken(payload, secret, "15m");
  }

  generateToken(
    payload: Record<string, unknown>,
    secret: string,
    expiresIn: SignOptions["expiresIn"],
  ) {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  generateRefreshToken(payload: Record<string, unknown>, secret: string) {
    return this.generateToken(payload, secret, "7d");
  }

  verifyRefreshToken(token: string, secret: string) {
    return this.jwtService.verifyAsync(token, { secret });
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: process.env.JWT_SECRET ?? "",
    });
  }

  decodePayload<T>(token: string): T {
    return decode(token) as T;
  }

  generateSessionSecret(): string {
    return randomBytes(32).toString("hex");
  }
}
