import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BotRegistryService } from "./bot-registry.service";
import { BotProfile } from "./entities/bot-profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BotProfile])],
  providers: [BotRegistryService],
  exports: [BotRegistryService],
})
export class BotRegistryModule {}
