import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173', // o tu frontend
    credentials: true, // ⚠️ necesario para que el navegador mande la cookie
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL], // 👉 Railway
      queue: 'identity_queue', // misma queue que usas en ClientsModule
      queueOptions: { durable: true },
      prefetchCount: 10, // opcional: controla concurrencia
    },
  });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().then(() => {
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
