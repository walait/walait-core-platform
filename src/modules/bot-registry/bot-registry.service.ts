import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BotHandlerKey } from "./bot-registry.enums";
import { BotProfile } from "./entities/bot-profile.entity";

@Injectable()
export class BotRegistryService {
  constructor(
    @InjectRepository(BotProfile)
    private readonly botRepository: Repository<BotProfile>,
  ) {}

  async getHandlerKey(phoneNumberId: string): Promise<BotHandlerKey | null> {
    const record = await this.botRepository.findOne({
      where: { phone_number_id: phoneNumberId, is_active: true },
    });
    return record?.handler_key ?? null;
  }
}
