import { ConfigModule, ConfigService } from "@nestjs/config";

import { APP_PIPE } from "@nestjs/core";
import { AppController } from "@/app.controller";
import { AppService } from "@/app.service";
import { EventBusModule } from "@/shared/event-bus/event-bus.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Module } from "@nestjs/common";
import { SharedModule } from "@/shared/shared.module";
import { TaxesModule } from "@/modules/taxes/taxes.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookModule } from "@/modules/webhook/webhook.module";
import { ZodValidationPipe } from "nestjs-zod";
import { getTypeOrmConfig } from "@/shared/database/typeorm.config";
import whatsappConfig from "@/config/whatsapp.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
      isGlobal: true,
      load: [whatsappConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    EventBusModule,
    EventEmitterModule.forRoot(),
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
