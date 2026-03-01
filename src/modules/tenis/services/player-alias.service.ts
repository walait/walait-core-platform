import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PlayerAlias } from "../entities/player-alias.entity";
import { normalizeName } from "./name-normalize";

export interface AliasResult {
  ok: boolean;
  reason?: string;
  alias?: PlayerAlias;
}

@Injectable()
export class PlayerAliasService {
  private readonly maxAliases = 3;

  constructor(
    @InjectRepository(PlayerAlias)
    private readonly aliasRepository: Repository<PlayerAlias>,
  ) {}

  async addAlias(playerId: string, alias: string): Promise<AliasResult> {
    const normalized = normalizeName(alias);
    if (!normalized) {
      return { ok: false, reason: "Alias invalido." };
    }

    const existing = await this.aliasRepository.findOne({
      where: { player_id: playerId, alias_normalized: normalized },
    });
    if (existing?.is_active) {
      return { ok: true, alias: existing };
    }

    const activeCount = await this.aliasRepository.count({
      where: { player_id: playerId, is_active: true },
    });
    if (activeCount >= this.maxAliases) {
      return {
        ok: false,
        reason: "Alcanzaste el maximo de 3 apodos activos.",
      };
    }

    if (existing && !existing.is_active) {
      existing.is_active = true;
      existing.alias = alias.trim();
      existing.alias_normalized = normalized;
      const saved = await this.aliasRepository.save(existing);
      return { ok: true, alias: saved };
    }

    const created = this.aliasRepository.create({
      player_id: playerId,
      alias: alias.trim(),
      alias_normalized: normalized,
      is_active: true,
    });
    const saved = await this.aliasRepository.save(created);
    return { ok: true, alias: saved };
  }

  async listAliases(playerId: string): Promise<PlayerAlias[]> {
    return this.aliasRepository.find({
      where: { player_id: playerId, is_active: true },
      order: { created_at: "ASC" },
    });
  }

  async removeAlias(playerId: string, alias: string): Promise<AliasResult> {
    const normalized = normalizeName(alias);
    if (!normalized) {
      return { ok: false, reason: "Alias invalido." };
    }

    const existing = await this.aliasRepository.findOne({
      where: { player_id: playerId, alias_normalized: normalized, is_active: true },
    });
    if (!existing) {
      return { ok: false, reason: "No encontre ese apodo." };
    }

    existing.is_active = false;
    const saved = await this.aliasRepository.save(existing);
    return { ok: true, alias: saved };
  }
}
