import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Job, Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Player } from "../entities/player.entity";
import { WhatsAppClient } from "../integrations/whatsapp.client";
import { ChallengeService } from "../services/challenge.service";

interface ExpireChallengePayload {
  challengeId: string;
}

@Injectable()
export class ExpireChallengeJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExpireChallengeJob.name);
  private queue?: Queue<ExpireChallengePayload>;
  private worker?: Worker<ExpireChallengePayload>;
  private connection?: Redis;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly challengeService: ChallengeService,
    private readonly whatsappClient: WhatsAppClient,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    this.connection = new Redis(this.redisUrl());
    this.queue = new Queue<ExpireChallengePayload>("tenis-expire-challenge", {
      connection: this.connection,
    });

    this.worker = new Worker<ExpireChallengePayload>(
      "tenis-expire-challenge",
      async (job: Job<ExpireChallengePayload>) => {
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

  async scheduleExpire(challengeId: string, runAt: Date): Promise<void> {
    if (!this.queue) {
      return;
    }

    const delay = Math.max(0, runAt.getTime() - Date.now());
    await this.queue.add("expire", { challengeId }, { delay, jobId: `expire:${challengeId}` });
  }

  private async process(payload: ExpireChallengePayload): Promise<void> {
    const expired = await this.challengeService.expireChallenge(payload.challengeId);
    if (!expired) {
      return;
    }

    const challenge = await this.challengeRepository.findOne({
      where: { id: payload.challengeId },
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
        "El desafio expiro por falta de respuesta.",
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
