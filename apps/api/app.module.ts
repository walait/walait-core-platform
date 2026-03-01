import { ConfigModule, ConfigService } from "@nestjs/config";

import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import whatsappConfig from "@/config/whatsapp.config";
import { TaxesModule } from "@/modules/taxes/taxes.module";
import { TenisModule } from "@/modules/tenis/tenis.module";
import { WebhookModule } from "@/modules/webhook/webhook.module";
import { getTypeOrmConfig } from "@/shared/database/typeorm.config";
import { EventBusModule } from "@/shared/event-bus/event-bus.module";
import { SharedModule } from "@/shared/shared.module";
import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { ZodValidationPipe } from "nestjs-zod";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
      isGlobal: true,
      load: [whatsappConfig],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        redact: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['x-hub-signature-256']",
        ],
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    EventBusModule,
    EventEmitterModule.forRoot(),
    WebhookModule,
    TenisModule,
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
