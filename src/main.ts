import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix("api");
	app.use(cookieParser());

	app.enableCors({
		origin: "http://localhost:5173", // o tu frontend
		credentials: true, // ⚠️ necesario para que el navegador mande la cookie
	});

	const rmqUrl = process.env.RABBITMQ_URL ?? "amqp://localhost";
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

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap().then(() => {
	console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
});
