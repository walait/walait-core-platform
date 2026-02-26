// src/shared/event-bus/event-bus.module.ts
import { Module, Global } from '@nestjs/common'; // Usa @Global() (Nest ≤ 9) …
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global() // …o { global: true } si estás en Nest 10+
@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'EVENT_BUS',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'identity_queue',
          queueOptions: { durable: true },
          socketOptions: {
            // 👇 evita undefined y te permite tunear
            heartbeatIntervalInSeconds: 20, // equivalente a heartbeat = 20
            reconnectTimeInSeconds: 5,
          },
        },
      },
    ]),
  ],
  exports: [ClientsModule], // ← exporta el ClientsModule para que el proxy sea inyectable en todo el proyecto
})
export class EventBusModule {}
