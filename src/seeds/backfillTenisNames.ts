import "reflect-metadata";

import { Player } from "@/modules/tenis/entities/player.entity";
import { normalizeName } from "@/modules/tenis/services/name-normalize";
import { config } from "dotenv";
import { DataSource, IsNull } from "typeorm";

config({ path: ".env" });

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.{ts,js}"],
  migrations: ["src/migrations/**/*.{ts,js}"],
  synchronize: false,
  logging: false,
});

async function backfillTenisNames() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Player);

  const players = await repo.find({
    where: [{ display_name_normalized: IsNull() }, { display_name_normalized: "" }],
  });

  for (const player of players) {
    const base = player.display_name || player.phone_e164;
    player.display_name_normalized = normalizeName(base);
  }

  if (players.length > 0) {
    await repo.save(players);
  }

  await AppDataSource.destroy();
  console.log(`✅ Backfill completo (${players.length} jugadores)`);
}

backfillTenisNames().catch((err) => {
  console.error("❌ Error during backfill:", err);
  AppDataSource.destroy();
});
