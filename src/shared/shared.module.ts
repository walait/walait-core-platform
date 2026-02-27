import { Global, Module } from "@nestjs/common";

import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisEnabled = config.get<string>("ENABLE_REDIS") === "true";
        const redisUrl = config.get<string>("REDIS_URL");

        if (!redisEnabled || !redisUrl) {
          return null;
        }

        const redis = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
        redis.on("error", () => null);
        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class SharedModule {}
