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

	app.enableCors({
		origin: "http://localhost:5173",
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

	const port = process.env.PORT ?? 3000;
	const host = process.env.HOST ?? "0.0.0.0";
	await app.listen(port, host);
}

bootstrap().then(() => {
	console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
