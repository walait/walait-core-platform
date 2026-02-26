import { ClientsModule, Transport } from "@nestjs/microservices";
// src/shared/event-bus/event-bus.module.ts
import { Global, Module } from "@nestjs/common"; // Usa @Global() (Nest ≤ 9) …

import { ConfigModule } from "@nestjs/config";

@Global() // …o { global: true } si estás en Nest 10+
@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: "EVENT_BUS",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL ?? "amqp://localhost"],
          queue: "identity_queue",
          queueOptions: { durable: true },
          socketOptions: {
            heartbeatIntervalInSeconds: 20,
            reconnectTimeInSeconds: 5,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule], // ← exporta el ClientsModule para que el proxy sea inyectable en todo el proyecto
})
export class EventBusModule {}
