import { Global, Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis(config.get('REDIS_URL'));
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class SharedModule {}
