import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import { RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Readable } from "node:stream";
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
  fastify.addHook(
    "preParsing",
    (
      request: { rawBody?: Buffer },
      reply: unknown,
      payload: NodeJS.ReadableStream,
      done: (error: Error | null, payload?: NodeJS.ReadableStream) => void,
    ) => {
      const chunks: Buffer[] = [];
      payload.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      payload.on("end", () => {
        const rawBody = Buffer.concat(chunks);
        request.rawBody = rawBody;
        done(null, Readable.from(rawBody));
      });
      payload.on("error", (error) => {
        done(error);
      });
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
