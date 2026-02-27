import { createHash } from "node:crypto";
import { REDIS_CLIENT } from "@/shared/shared.module";
import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { parseStringPromise } from "xml2js";

@Injectable()
export class TokenStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  private getCacheKey(service: string, cert: string, key: string): string {
    const hash = createHash("sha256")
      .update(cert + key + service)
      .digest("hex");
    return `afip:ta:${hash}`;
  }

  async getValid(
    service: string,
    cert: string,
    key: string,
  ): Promise<any | null> {
    if (!this.redis) {
      return null;
    }

    const redisKey = this.getCacheKey(service, cert, key);
    const raw = await this.redis.get(redisKey);
    if (!raw) {
      console.log(`[AFIP][${redisKey}] No se encontró TA en caché`);
      return null;
    }

    const parsed = await parseStringPromise(raw);
    const exp = parsed?.loginTicketResponse?.header?.[0]?.expirationTime?.[0];
    if (!exp) {
      console.warn(`[AFIP][${redisKey}] TA sin expirationTime`);
      return null;
    }

    const expiration = new Date(exp);
    const now = new Date();

    const remainingSec = Math.floor(
      (expiration.getTime() - now.getTime()) / 1000,
    );
    console.log(
      `[AFIP][${redisKey}] Expira: ${expiration.toISOString()} (en ${remainingSec}s / ${(remainingSec / 3600).toFixed(2)}h)`,
    );

    return expiration > now ? raw : null;
  }

  async save(
    service: string,
    cert: string,
    key: string,
    taXml: string,
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    const redisKey = this.getCacheKey(service, cert, key);
    const parsed = await parseStringPromise(taXml);
    const exp: string =
      parsed?.loginTicketResponse?.header?.[0]?.expirationTime?.[0];
    if (!exp) throw new Error("TA sin expirationTime");

    const expiration = new Date(exp);
    const ttl = Math.floor((expiration.getTime() - Date.now()) / 1000);
    await this.redis.set(redisKey, taXml, "EX", ttl);
  }
}
