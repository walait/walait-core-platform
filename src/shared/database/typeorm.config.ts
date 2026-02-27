import { ConfigService } from "@nestjs/config";
import { DataSourceOptions } from "typeorm";

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  console.log(__dirname + "/../../../**/**/entities/*.entity.{ts,js}");

  return {
    type: "postgres",
    url: configService.get<string>("DATABASE_URL"),
    entities: [
      __dirname + "/../../services/**/modules/**/model/*.entity.{ts,js}",
      __dirname + "/../../modules/**/domain/model/*.entity.{ts,js}",
      __dirname + "/../../modules/taxes/infrastructure/**/*.entity.{ts,js}",
    ],
    synchronize: false, // true solo en desarrollo, cuidado en prod
    logging: true,
  };
};
