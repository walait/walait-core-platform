import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";

config({ path: ".env" });
config({ path: ".env.local", override: true });

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [],
  migrations: ["src/migrations/**/*.{ts,js}"],
  synchronize: false,
  logging: true,
});
