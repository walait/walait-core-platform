import fastifyCookie from '@fastify/cookie';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 2 * 1024 * 1024,
    }),
  );
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'webhook', method: RequestMethod.GET },
      { path: 'webhook', method: RequestMethod.POST },
    ],
  });
  await app.register(fastifyCookie);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'identity_queue',
      queueOptions: { durable: true },
      prefetchCount: 10,
    },
  });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().then(() => {
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
