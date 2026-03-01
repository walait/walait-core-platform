import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { In, Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Dispute } from "../entities/dispute.entity";
import { Match } from "../entities/match.entity";
import { PlayerStats } from "../entities/player-stats.entity";
import { Player } from "../entities/player.entity";
import { ResultReport } from "../entities/result-report.entity";
import { SheetsClient } from "../integrations/sheets.client";
import { RankingService } from "../services/ranking.service";

interface ExportPayload {
  reason: string;
}

@Injectable()
export class ExportSheetsJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportSheetsJob.name);
  private queue?: Queue<ExportPayload>;
  private worker?: Worker<ExportPayload>;
  private connection?: Redis;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(PlayerStats)
    private readonly statsRepository: Repository<PlayerStats>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(ResultReport)
    private readonly reportRepository: Repository<ResultReport>,
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    private readonly sheetsClient: SheetsClient,
    private readonly rankingService: RankingService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    this.connection = new Redis(this.redisUrl());
    this.queue = new Queue<ExportPayload>("tenis-export-sheets", {
      connection: this.connection,
    });
    this.worker = new Worker<ExportPayload>(
      "tenis-export-sheets",
      async (job: Job<ExportPayload>) => {
        await this.process(job.data);
      },
      { connection: this.connection },
    );

    await this.scheduleCron();
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async runNow(): Promise<void> {
    if (!this.queue) {
      await this.process({ reason: "direct" });
      return;
    }

    await this.queue.add("export", { reason: "manual" });
  }

  private async scheduleCron(): Promise<void> {
    if (!this.queue || !this.shouldScheduleCron()) {
      return;
    }

    const cron = this.configService.get<string>("SHEETS_EXPORT_CRON") ?? "";
    if (!cron) {
      return;
    }

    const tz = this.configService.get<string>("TZ") ?? undefined;
    await this.queue.add(
      "export",
      { reason: "cron" },
      {
        repeat: tz ? { pattern: cron, tz } : { pattern: cron },
        jobId: "export:cron",
      },
    );
  }

  private async process(payload: ExportPayload): Promise<void> {
    this.logger.log(`Exporting sheets: ${payload.reason}`);
    await this.rankingService.recalculateRanking();

    const players = await this.playerRepository.find();
    const stats = await this.statsRepository.find();
    const playerById = new Map(players.map((player) => [player.id, player]));
    const rankingValues: (string | number | null)[][] = [["pos", "nombre", "puntos", "telefono"]];
    const sorted = [...stats].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return a.player_id.localeCompare(b.player_id);
    });

    for (const stat of sorted) {
      const player = playerById.get(stat.player_id);
      rankingValues.push([
        stat.rank_position ?? null,
        player?.display_name ?? "N/A",
        stat.points,
        player?.phone_e164 ?? "N/A",
      ]);
    }

    const matches = await this.matchRepository.find();
    const challengeIds = matches.map((match) => match.challenge_id);
    const challenges = await this.challengeRepository.find({
      where: { id: In(challengeIds) },
    });
    const challengeById = new Map(challenges.map((c) => [c.id, c]));
    const reports = await this.reportRepository.find({
      where: { match_id: In(matches.map((m) => m.id)) },
    });
    const reportByMatch = new Map(reports.map((r) => [r.match_id, r]));

    const matchesValues: (string | number | null)[][] = [
      ["estado", "jugador_a", "jugador_b", "fecha", "slot", "resultado"],
    ];
    for (const match of matches) {
      const challenge = challengeById.get(match.challenge_id);
      const playerA = challenge ? playerById.get(challenge.challenger_id) : undefined;
      const playerB = challenge ? playerById.get(challenge.challenged_id) : undefined;
      const report = reportByMatch.get(match.id);
      matchesValues.push([
        match.status,
        playerA?.display_name ?? "N/A",
        playerB?.display_name ?? "N/A",
        match.scheduled_date ?? null,
        match.scheduled_slot ?? null,
        report?.score_raw ?? null,
      ]);
    }

    const disputes = await this.disputeRepository.find();
    const disputesValues: (string | number | null)[][] = [
      ["matchId", "players", "score_reportado", "estado"],
    ];
    for (const dispute of disputes) {
      const match = matches.find((m) => m.id === dispute.match_id);
      const challenge = match ? challengeById.get(match.challenge_id) : undefined;
      const playerA = challenge ? playerById.get(challenge.challenger_id) : undefined;
      const playerB = challenge ? playerById.get(challenge.challenged_id) : undefined;
      const report = reportByMatch.get(dispute.match_id);
      disputesValues.push([
        dispute.match_id,
        `${playerA?.display_name ?? "N/A"} vs ${playerB?.display_name ?? "N/A"}`,
        report?.score_raw ?? null,
        dispute.resolved_at ? "RESUELTA" : "ABIERTA",
      ]);
    }

    await this.sheetsClient.batchUpdate([
      { range: "Ranking!A1", values: rankingValues },
      { range: "Partidos!A1", values: matchesValues },
      { range: "Disputas!A1", values: disputesValues },
    ]);
  }

  private isEnabled(): boolean {
    const bullmq = this.configService.get<string>("ENABLE_BULLMQ");
    const redis = this.configService.get<string>("ENABLE_REDIS");
    return bullmq === "true" && redis === "true";
  }

  private shouldScheduleCron(): boolean {
    const sheets = this.configService.get<string>("ENABLE_SHEETS");
    return sheets === "true";
  }

  private redisUrl(): string {
    return this.configService.get<string>("REDIS_URL") ?? "redis://localhost:6379";
  }
}
