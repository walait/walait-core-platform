import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { APP_PIPE } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EventBusModule } from "./shared/event-bus/event-bus.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { IdentityModule } from "./modules/identity/identity.module";
import { Module } from "@nestjs/common";
import { TaxesModule } from "./modules/taxes/taxes.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ZodValidationPipe } from "nestjs-zod";
import { getTypeOrmConfig } from "./shared/database/typeorm.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env.local", ".env"],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    // EventBusModule,
    // IdentityModule,
    // TaxesModule,
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
