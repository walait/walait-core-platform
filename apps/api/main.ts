import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 2 * 1024 * 1024,
    }),
  );
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "webhook", method: RequestMethod.GET },
      { path: "webhook", method: RequestMethod.POST },
    ],
  });
  await app.register(fastifyCookie);

  const fastify = app.getHttpAdapter().getInstance() as any;
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" as const },
    (
      request: { rawBody?: Buffer },
      body: Buffer,
      done: (error: Error | null, value?: unknown) => void,
    ) => {
      request.rawBody = body;
      try {
        const parsed = JSON.parse(body.toString("utf8"));
        done(null, parsed);
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );

  const corsOrigin = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigin && corsOrigin.length > 0 ? corsOrigin : true,
    credentials: true,
  });

  const rmqEnabled = process.env.ENABLE_RMQ === "true";
  const rmqUrl = process.env.RABBITMQ_URL;
  if (rmqEnabled && rmqUrl) {
    try {
      app.connectMicroservice({
        transport: Transport.RMQ,
        options: {
          urls: [rmqUrl],
          queue: "identity_queue",
          queueOptions: { durable: true },
          prefetchCount: 10,
        },
      });
      await app.startAllMicroservices();
      console.log("RMQ microservice connected.");
    } catch (error) {
      console.error("RMQ connection failed; continuing without RMQ.", error);
    }
  } else {
    console.log("RMQ disabled; skipping RMQ microservice.");
  }

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
}

bootstrap().then(() => {
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
