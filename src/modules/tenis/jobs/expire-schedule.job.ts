import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Match } from "../entities/match.entity";
import { Player } from "../entities/player.entity";
import { WhatsAppClient } from "../integrations/whatsapp.client";
import { MatchStatus } from "../tenis.enums";

interface ExpireSchedulePayload {
  matchId: string;
}

@Injectable()
export class ExpireScheduleJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpireScheduleJob.name);
  private queue?: Queue<ExpireSchedulePayload>;
  private worker?: Worker<ExpireSchedulePayload>;
  private connection?: Redis;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly whatsappClient: WhatsAppClient,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    this.connection = new Redis(this.redisUrl());
    this.queue = new Queue<ExpireSchedulePayload>("tenis-expire-schedule", {
      connection: this.connection,
    });
    this.worker = new Worker<ExpireSchedulePayload>(
      "tenis-expire-schedule",
      async (job: Job<ExpireSchedulePayload>) => {
        await this.process(job.data);
      },
      { connection: this.connection },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async scheduleExpire(matchId: string, runAt: Date): Promise<void> {
    if (!this.queue) {
      return;
    }

    const jobId = `expire-schedule:${matchId}`;
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      await existing.remove();
    }

    const delay = Math.max(0, runAt.getTime() - Date.now());
    await this.queue.add("expire", { matchId }, { delay, jobId });
  }

  private async process(payload: ExpireSchedulePayload): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id: payload.matchId },
    });
    if (!match || match.status !== MatchStatus.PENDING_SCHEDULE) {
      return;
    }

    match.status = MatchStatus.CANCELLED;
    await this.matchRepository.save(match);

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return;
    }

    const players = await this.playerRepository.find({
      where: [{ id: challenge.challenger_id }, { id: challenge.challenged_id }],
    });
    for (const player of players) {
      await this.whatsappClient.sendTextMessage(
        player.phone_e164,
        "El match se cancelo por falta de agenda en 48hs.",
      );
    }
  }

  private isEnabled(): boolean {
    const bullmq = this.configService.get<string>("ENABLE_BULLMQ");
    const redis = this.configService.get<string>("ENABLE_REDIS");
    return bullmq === "true" && redis === "true";
  }

  private redisUrl(): string {
    return this.configService.get<string>("REDIS_URL") ?? "redis://localhost:6379";
  }
}
