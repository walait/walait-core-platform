import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Player } from "../entities/player.entity";
import { WhatsAppClient } from "../integrations/whatsapp.client";
import { ExpireChallengeJob } from "../jobs/expire-challenge.job";
import { ChallengeStatus } from "../tenis.enums";
import { AuditService } from "./audit.service";
import { LimitsService } from "./limits.service";
import { MatchService } from "./match.service";
import { RankingService } from "./ranking.service";

export interface ChallengeActionResult {
  ok: boolean;
  reason?: string;
  challenge?: Challenge;
}

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    private readonly limitsService: LimitsService,
    private readonly rankingService: RankingService,
    private readonly matchService: MatchService,
    @Inject(forwardRef(() => ExpireChallengeJob))
    private readonly jobs: ExpireChallengeJob,
    private readonly whatsappClient: WhatsAppClient,
    private readonly auditService: AuditService,
  ) {}

  async createChallenge(challenger: Player, challenged: Player): Promise<ChallengeActionResult> {
    if (challenger.id === challenged.id) {
      return { ok: false, reason: "No podes desafiarte a vos mismo." };
    }

    const period = this.limitsService.getCurrentPeriod();
    const canSend = await this.limitsService.canSendChallenge(challenger.id, period);
    if (!canSend) {
      return {
        ok: false,
        reason: "Ya alcanzaste el limite mensual de desafios enviados.",
      };
    }

    const challengerRank = await this.rankingService.getRankPosition(challenger.id);
    const challengedRank = await this.rankingService.getRankPosition(challenged.id);
    const diff = Math.abs(challengerRank - challengedRank);
    if (diff > 10) {
      return {
        ok: false,
        reason: "Solo podes desafiar jugadores con diferencia de 10 puestos.",
      };
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const challenge = this.challengeRepository.create({
      challenger_id: challenger.id,
      challenged_id: challenged.id,
      status: ChallengeStatus.PENDING,
      expires_at: expiresAt,
      accepted_at: null,
      rejected_at: null,
      expired_at: null,
      challenger_rank_at_create: null,
      challenged_rank_at_create: null,
    });

    const saved = await this.challengeRepository.save(challenge);
    await this.limitsService.incrementSent(challenger.id, period);
    await this.jobs.scheduleExpire(saved.id, expiresAt);

    await this.auditService.log("Challenge", saved.id, "create", challenger.phone_e164, {
      challenged: challenged.phone_e164,
    });

    await this.whatsappClient.sendChallengeRequest(challenged.phone_e164, {
      challengeId: saved.id,
      challengerName: challenger.display_name,
    });

    return { ok: true, challenge: saved };
  }

  async acceptChallenge(challengeId: string, challenged: Player): Promise<ChallengeActionResult> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge || challenge.status !== ChallengeStatus.PENDING) {
      return { ok: false, reason: "El desafio no esta disponible." };
    }

    if (challenge.challenged_id !== challenged.id) {
      return { ok: false, reason: "No sos el desafiado de este desafio." };
    }

    const period = this.limitsService.getCurrentPeriod();
    const canAccept = await this.limitsService.canAcceptChallenge(challenged.id, period);
    if (!canAccept) {
      return {
        ok: false,
        reason: "Ya alcanzaste el limite mensual de desafios aceptados.",
      };
    }

    const challengerRank = await this.rankingService.getRankPosition(challenge.challenger_id);
    const challengedRank = await this.rankingService.getRankPosition(challenge.challenged_id);

    challenge.status = ChallengeStatus.ACCEPTED;
    challenge.accepted_at = new Date();
    challenge.challenger_rank_at_create = challengerRank;
    challenge.challenged_rank_at_create = challengedRank;
    await this.challengeRepository.save(challenge);
    await this.limitsService.incrementAccepted(challenged.id, period);

    const match = await this.matchService.createMatch(challenge.id);

    await this.auditService.log("Challenge", challenge.id, "accept", challenged.phone_e164, {
      matchId: match.id,
    });

    return { ok: true, challenge };
  }

  async rejectChallenge(challengeId: string, challenged: Player): Promise<ChallengeActionResult> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge || challenge.status !== ChallengeStatus.PENDING) {
      return { ok: false, reason: "El desafio no esta disponible." };
    }

    if (challenge.challenged_id !== challenged.id) {
      return { ok: false, reason: "No sos el desafiado de este desafio." };
    }

    challenge.status = ChallengeStatus.REJECTED;
    challenge.rejected_at = new Date();
    await this.challengeRepository.save(challenge);
    await this.auditService.log("Challenge", challenge.id, "reject", challenged.phone_e164, null);

    return { ok: true, challenge };
  }

  async expireChallenge(challengeId: string): Promise<boolean> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });
    if (!challenge || challenge.status !== ChallengeStatus.PENDING) {
      return false;
    }

    if (new Date() < challenge.expires_at) {
      return false;
    }

    challenge.status = ChallengeStatus.EXPIRED;
    challenge.expired_at = new Date();
    await this.challengeRepository.save(challenge);
    await this.auditService.log("Challenge", challenge.id, "expire", null, null);
    return true;
  }
}
