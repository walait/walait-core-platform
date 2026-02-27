import { ClientsModule, Transport } from "@nestjs/microservices";
// src/shared/event-bus/event-bus.module.ts
import { Global, Module } from "@nestjs/common"; // Usa @Global() (Nest ≤ 9) …

import { ConfigModule, ConfigService } from "@nestjs/config";

@Global() // …o { global: true } si estás en Nest 10+
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: "EVENT_BUS",
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.get<string>("RABBITMQ_URL");
          return {
            transport: Transport.RMQ,
            options: {
              urls: rmqUrl ? [rmqUrl] : [],
              queue: "identity_queue",
              queueOptions: { durable: true },
              socketOptions: {
                heartbeatIntervalInSeconds: 20,
                reconnectTimeInSeconds: 5,
              },
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule], // ← exporta el ClientsModule para que el proxy sea inyectable en todo el proyecto
})
export class EventBusModule {}
