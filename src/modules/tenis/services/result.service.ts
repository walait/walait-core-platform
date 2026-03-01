import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Dispute } from "../entities/dispute.entity";
import { Match } from "../entities/match.entity";
import { Player } from "../entities/player.entity";
import { ResultReport } from "../entities/result-report.entity";
import { WhatsAppClient } from "../integrations/whatsapp.client";
import { DisputeResolutionType, MatchStatus, ResultReportStatus } from "../tenis.enums";
import { AuditService } from "./audit.service";
import { RankingService } from "./ranking.service";

export interface ResultActionResult {
  ok: boolean;
  reason?: string;
  report?: ResultReport;
}

@Injectable()
export class ResultService {
  constructor(
    @InjectRepository(ResultReport)
    private readonly reportRepository: Repository<ResultReport>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly rankingService: RankingService,
    private readonly whatsappClient: WhatsAppClient,
    private readonly auditService: AuditService,
  ) {}

  async reportResult(
    matchId: string,
    reporter: Player,
    scoreRaw: string,
  ): Promise<ResultActionResult> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    if (match.status !== MatchStatus.SCHEDULED) {
      return { ok: false, reason: "El match no esta listo para resultado." };
    }

    if (!this.isValidScore(scoreRaw)) {
      return { ok: false, reason: "Resultado invalido." };
    }

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return { ok: false, reason: "Desafio no encontrado." };
    }

    if (reporter.id !== challenge.challenger_id && reporter.id !== challenge.challenged_id) {
      return { ok: false, reason: "No participas de este match." };
    }

    const existing = await this.reportRepository.findOne({
      where: { match_id: match.id },
    });
    if (existing && existing.status === ResultReportStatus.PENDING_CONFIRMATION) {
      return { ok: false, reason: "Ya hay un resultado pendiente." };
    }

    const report = this.reportRepository.create({
      match_id: match.id,
      reported_by_player_id: reporter.id,
      score_raw: scoreRaw.trim(),
      status: ResultReportStatus.PENDING_CONFIRMATION,
      confirmed_at: null,
      rejected_at: null,
      confirmed_by_player_id: null,
    });
    const saved = await this.reportRepository.save(report);

    match.status = MatchStatus.PENDING_RESULT_CONFIRMATION;
    await this.matchRepository.save(match);

    const opponent = await this.getOpponent(match, reporter.id);
    if (opponent) {
      await this.whatsappClient.sendResultConfirmation(opponent.phone_e164, {
        reportId: saved.id,
        score: saved.score_raw,
      });
    }

    await this.auditService.log("Match", match.id, "result_report", reporter.phone_e164, {
      reportId: saved.id,
    });

    return { ok: true, report: saved };
  }

  async confirmResult(reportId: string, confirmer: Player): Promise<ResultActionResult> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report || report.status !== ResultReportStatus.PENDING_CONFIRMATION) {
      return { ok: false, reason: "No hay resultado pendiente." };
    }

    if (report.reported_by_player_id === confirmer.id) {
      return { ok: false, reason: "El autor del reporte no puede confirmar." };
    }

    const match = await this.matchRepository.findOne({ where: { id: report.match_id } });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    report.status = ResultReportStatus.CONFIRMED;
    report.confirmed_at = new Date();
    report.confirmed_by_player_id = confirmer.id;
    await this.reportRepository.save(report);

    match.status = MatchStatus.CLOSED;
    await this.matchRepository.save(match);

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    const rankDiff = this.rankDiffFromChallenge(challenge);
    await this.rankingService.applyMatchPoints(
      report.reported_by_player_id,
      confirmer.id,
      rankDiff,
    );

    await this.auditService.log("Match", match.id, "result_confirm", confirmer.phone_e164, {
      reportId: report.id,
    });

    return { ok: true, report };
  }

  async rejectResult(reportId: string, rejecter: Player): Promise<ResultActionResult> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report || report.status !== ResultReportStatus.PENDING_CONFIRMATION) {
      return { ok: false, reason: "No hay resultado pendiente." };
    }

    if (report.reported_by_player_id === rejecter.id) {
      return { ok: false, reason: "El autor del reporte no puede rechazar." };
    }

    const match = await this.matchRepository.findOne({ where: { id: report.match_id } });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    report.status = ResultReportStatus.REJECTED;
    report.rejected_at = new Date();
    await this.reportRepository.save(report);

    match.status = MatchStatus.DISPUTED;
    await this.matchRepository.save(match);

    const dispute = this.disputeRepository.create({
      match_id: match.id,
      reason: null,
      opened_at: new Date(),
      resolved_at: null,
      resolved_by: null,
      resolution_type: null,
    });
    await this.disputeRepository.save(dispute);

    await this.auditService.log("Match", match.id, "result_reject", rejecter.phone_e164, {
      reportId: report.id,
    });

    return { ok: true, report };
  }

  async applyWalkover(
    matchId: string,
    winnerId: string,
    actorPhone?: string,
  ): Promise<ResultActionResult> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return { ok: false, reason: "Desafio no encontrado." };
    }

    const loserId =
      challenge.challenger_id === winnerId ? challenge.challenged_id : challenge.challenger_id;
    const rankDiff = this.rankDiffFromChallenge(challenge);
    await this.rankingService.applyMatchPoints(winnerId, loserId, rankDiff);

    match.status = MatchStatus.CLOSED;
    await this.matchRepository.save(match);

    await this.auditService.log("Match", match.id, "walkover", actorPhone ?? null, {
      winnerId,
    });

    return { ok: true };
  }

  async resolveDispute(
    matchId: string,
    scoreRaw: string,
    actorPhone?: string,
  ): Promise<ResultActionResult> {
    const report = await this.reportRepository.findOne({
      where: { match_id: matchId },
    });
    if (!report) {
      return { ok: false, reason: "No hay reporte para resolver." };
    }

    if (!this.isValidScore(scoreRaw)) {
      return { ok: false, reason: "Resultado invalido." };
    }

    report.score_raw = scoreRaw.trim();
    report.status = ResultReportStatus.CONFIRMED;
    report.confirmed_at = new Date();
    await this.reportRepository.save(report);

    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (match) {
      match.status = MatchStatus.CLOSED;
      await this.matchRepository.save(match);
    }

    const dispute = await this.disputeRepository.findOne({
      where: { match_id: matchId },
    });
    if (dispute) {
      dispute.resolved_at = new Date();
      dispute.resolved_by = actorPhone ?? null;
      dispute.resolution_type = DisputeResolutionType.ADMIN_SET_SCORE;
      await this.disputeRepository.save(dispute);
    }

    if (match) {
      const challenge = await this.challengeRepository.findOne({
        where: { id: match.challenge_id },
      });
      const rankDiff = this.rankDiffFromChallenge(challenge);
      const winnerId = report.reported_by_player_id;
      const loserId = challenge
        ? challenge.challenger_id === winnerId
          ? challenge.challenged_id
          : challenge.challenger_id
        : winnerId;
      report.confirmed_by_player_id = loserId;
      await this.reportRepository.save(report);
      await this.rankingService.applyMatchPoints(winnerId, loserId, rankDiff);
    }

    await this.auditService.log("Match", matchId, "dispute_resolve", actorPhone ?? null, {
      reportId: report.id,
    });

    return { ok: true, report };
  }

  async cancelMatch(matchId: string, actorPhone?: string): Promise<ResultActionResult> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    match.status = MatchStatus.CANCELLED;
    await this.matchRepository.save(match);
    await this.auditService.log("Match", match.id, "cancel", actorPhone ?? null, null);
    return { ok: true };
  }

  private async getOpponent(match: Match, playerId: string): Promise<Player | null> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return null;
    }

    const opponentId =
      challenge.challenger_id === playerId ? challenge.challenged_id : challenge.challenger_id;
    return this.playerRepository.findOne({ where: { id: opponentId } });
  }

  private rankDiffFromChallenge(challenge: Challenge | null): number {
    if (!challenge) {
      return 0;
    }

    const challengerRank = challenge.challenger_rank_at_create ?? 0;
    const challengedRank = challenge.challenged_rank_at_create ?? 0;
    return Math.abs(challengerRank - challengedRank);
  }

  private isValidScore(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }

    const setRegex = /^\d{1,2}-\d{1,2}(\s+\d{1,2}-\d{1,2})*$/;
    return setRegex.test(normalized);
  }
}
