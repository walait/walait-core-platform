import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { PlayerStats } from "../entities/player-stats.entity";
import { Player } from "../entities/player.entity";

export interface RankingRow {
  playerId: string;
  name: string;
  points: number;
  rank: number;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(PlayerStats)
    private readonly statsRepository: Repository<PlayerStats>,
  ) {}

  async ensureStats(playerId: string): Promise<PlayerStats> {
    const existing = await this.statsRepository.findOne({
      where: { player_id: playerId },
    });
    if (existing) {
      return existing;
    }

    const created = this.statsRepository.create({
      player_id: playerId,
      points: 0,
      rank_position: null,
      last_rank_recalc_at: null,
    });
    return this.statsRepository.save(created);
  }

  async recalculateRanking(): Promise<Map<string, number>> {
    const players = await this.playerRepository.find({
      where: { is_active: true },
    });
    const playerIds = players.map((player) => player.id);
    if (playerIds.length === 0) {
      return new Map();
    }

    const existingStats = await this.statsRepository.find({
      where: { player_id: In(playerIds) },
    });
    const existingIds = new Set(existingStats.map((stat) => stat.player_id));

    const missing = playerIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      const newStats = missing.map((id) =>
        this.statsRepository.create({
          player_id: id,
          points: 0,
          rank_position: null,
          last_rank_recalc_at: null,
        }),
      );
      await this.statsRepository.save(newStats);
    }

    const stats = await this.statsRepository.find({
      order: { points: "DESC", player_id: "ASC" },
    });

    const now = new Date();
    const ranking = new Map<string, number>();
    for (const [index, stat] of stats.entries()) {
      const position = index + 1;
      stat.rank_position = position;
      stat.last_rank_recalc_at = now;
      ranking.set(stat.player_id, position);
    }

    await this.statsRepository.save(stats);
    return ranking;
  }

  async getRankPosition(playerId: string): Promise<number> {
    await this.ensureStats(playerId);
    const ranking = await this.recalculateRanking();
    return ranking.get(playerId) ?? ranking.size + 1;
  }

  async applyMatchPoints(winnerId: string, loserId: string, rankDiff: number): Promise<void> {
    const winnerStats = await this.ensureStats(winnerId);
    const loserStats = await this.ensureStats(loserId);

    winnerStats.points += 125 + 5 * rankDiff;
    loserStats.points += 25;

    await this.statsRepository.save([winnerStats, loserStats]);
    await this.recalculateRanking();
  }

  async getRankingList(limit = 10): Promise<RankingRow[]> {
    await this.recalculateRanking();
    const stats = await this.statsRepository.find({
      order: { points: "DESC", player_id: "ASC" },
      take: limit,
    });
    const players = await this.playerRepository.find({
      where: { id: In(stats.map((stat) => stat.player_id)) },
    });
    const playerById = new Map(players.map((player) => [player.id, player]));

    const sorted = [...stats].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return a.player_id.localeCompare(b.player_id);
    });

    return sorted.map((stat, index) => ({
      playerId: stat.player_id,
      name: playerById.get(stat.player_id)?.display_name ?? "N/A",
      points: stat.points,
      rank: stat.rank_position ?? index + 1,
    }));
  }
}
