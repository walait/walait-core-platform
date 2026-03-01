import "reflect-metadata";

import { BotHandlerKey } from "@/modules/bot-registry/bot-registry.enums";
import { BotProfile } from "@/modules/bot-registry/entities/bot-profile.entity";
import { config } from "dotenv";
import { DataSource } from "typeorm";

config({ path: ".env" });

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.{ts,js}"],
  migrations: ["src/migrations/**/*.{ts,js}"],
  synchronize: false,
  logging: false,
});

async function seedBotRegistry() {
  const phoneNumberId = process.env.TENIS_PHONE_NUMBER_ID ?? process.env.META_PHONE_NUMBER_ID ?? "";

  if (!phoneNumberId) {
    throw new Error("TENIS_PHONE_NUMBER_ID o META_PHONE_NUMBER_ID no configurado");
  }

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(BotProfile);

  const existing = await repo.findOne({
    where: { phone_number_id: phoneNumberId },
  });

  if (existing) {
    existing.name = "Tenis";
    existing.handler_key = BotHandlerKey.TENIS;
    existing.is_active = true;
    await repo.save(existing);
  } else {
    const created = repo.create({
      name: "Tenis",
      phone_number_id: phoneNumberId,
      handler_key: BotHandlerKey.TENIS,
      is_active: true,
    });
    await repo.save(created);
  }

  await AppDataSource.destroy();
}

seedBotRegistry()
  .then(() => {
    console.log("✅ Bot registry seeded");
  })
  .catch((err) => {
    console.error("❌ Error during bot registry seed:", err);
  })
  .finally(() => {
    if (AppDataSource.isInitialized) {
      void AppDataSource.destroy();
    }
  });
