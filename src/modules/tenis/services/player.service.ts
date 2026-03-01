import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Player } from "../entities/player.entity";
import { normalizeName } from "./name-normalize";

export interface EnsuredPlayer {
  player: Player;
  created: boolean;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async ensurePlayer(phoneE164: string, displayName?: string): Promise<EnsuredPlayer> {
    const existing = await this.playerRepository.findOne({
      where: { phone_e164: phoneE164 },
    });

    if (existing) {
      if (!existing.display_name_normalized) {
        const base = existing.display_name || existing.phone_e164;
        existing.display_name_normalized = normalizeName(base);
        await this.playerRepository.save(existing);
      }
      return { player: existing, created: false };
    }

    const player = this.playerRepository.create({
      phone_e164: phoneE164,
      display_name: displayName?.trim() || phoneE164,
      display_name_normalized: normalizeName(displayName?.trim() || phoneE164),
      is_active: true,
    });

    const saved = await this.playerRepository.save(player);
    return { player: saved, created: true };
  }
}
