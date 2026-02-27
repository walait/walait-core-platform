import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import whatsappConfig from '@/config/whatsapp.config';
import { IdentityModule } from '@/modules/identity/identity.module';
import { TaxesModule } from '@/modules/taxes/taxes.module';
import { WebhookModule } from '@/modules/webhook/webhook.module';
import { getTypeOrmConfig } from '@/shared/database/typeorm.config';
import { EventBusModule } from '@/shared/event-bus/event-bus.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      load: [whatsappConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    EventBusModule,
    IdentityModule,
    TaxesModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
