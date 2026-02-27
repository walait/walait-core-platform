import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.use(cookieParser());

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
  } else {
    console.log("RMQ disabled; skipping RMQ microservice.");
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().then(() => {
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
