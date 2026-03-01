import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { PlayerAlias } from "../entities/player-alias.entity";
import { Player } from "../entities/player.entity";
import { normalizeName } from "./name-normalize";

export interface PlayerSearchResult {
  matches: Player[];
  query: string;
  isPhone: boolean;
}

@Injectable()
export class PlayerSearchService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(PlayerAlias)
    private readonly aliasRepository: Repository<PlayerAlias>,
  ) {}

  async searchOpponents(input: string, excludePlayerId?: string): Promise<PlayerSearchResult> {
    const trimmed = input.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (/^\+?\d+$/.test(trimmed) && digits.length >= 8) {
      const match = await this.playerRepository.findOne({
        where: { phone_e164: digits, is_active: true },
      });
      const matches = match && match.id !== excludePlayerId ? [match] : [];
      return { matches, query: digits, isPhone: true };
    }

    const normalized = normalizeName(trimmed);
    if (!normalized) {
      return { matches: [], query: normalized, isPhone: false };
    }

    const nameMatches = await this.playerRepository.find({
      where: {
        display_name_normalized: ILike(`%${normalized}%`),
        is_active: true,
      },
    });

    const aliasMatches = await this.aliasRepository.find({
      where: { alias_normalized: ILike(`%${normalized}%`), is_active: true },
    });
    const aliasIds = aliasMatches.map((alias) => alias.player_id);
    const aliasPlayers = aliasIds.length
      ? await this.playerRepository.find({
          where: { id: In(aliasIds), is_active: true },
        })
      : [];

    const combined = new Map<string, Player>();
    for (const player of [...nameMatches, ...aliasPlayers]) {
      if (excludePlayerId && player.id === excludePlayerId) {
        continue;
      }
      combined.set(player.id, player);
    }

    return { matches: [...combined.values()], query: normalized, isPhone: false };
  }
}
