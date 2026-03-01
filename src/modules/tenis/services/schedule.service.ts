import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Challenge } from "../entities/challenge.entity";
import { Match } from "../entities/match.entity";
import { Player } from "../entities/player.entity";
import { ScheduleOption } from "../entities/schedule-option.entity";
import { ScheduleProposal } from "../entities/schedule-proposal.entity";
import { WhatsAppClient } from "../integrations/whatsapp.client";
import { MatchStatus, ScheduleOptionKind, ScheduleProposalStatus } from "../tenis.enums";
import { ScheduleOptionInput, ScheduleSelectionResult } from "../tenis.types";
import { AuditService } from "./audit.service";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(ScheduleProposal)
    private readonly proposalRepository: Repository<ScheduleProposal>,
    @InjectRepository(ScheduleOption)
    private readonly optionRepository: Repository<ScheduleOption>,
    private readonly whatsappClient: WhatsAppClient,
    private readonly auditService: AuditService,
  ) {}

  async proposeSchedule(
    matchId: string,
    proposer: Player,
    options: ScheduleOptionInput[],
  ): Promise<ScheduleSelectionResult> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    if (match.status !== MatchStatus.PENDING_SCHEDULE) {
      return { ok: false, reason: "El match no acepta propuestas." };
    }

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return { ok: false, reason: "Desafio no encontrado." };
    }

    if (challenge.challenger_id !== proposer.id) {
      return { ok: false, reason: "Solo el challenger puede proponer agenda." };
    }

    const limitedOptions = options.slice(0, 3);
    if (limitedOptions.length === 0) {
      return { ok: false, reason: "Necesitas al menos una opcion." };
    }

    const proposal = this.proposalRepository.create({
      match_id: match.id,
      proposed_by_player_id: proposer.id,
      status: ScheduleProposalStatus.OPEN,
    });
    const savedProposal = await this.proposalRepository.save(proposal);

    const optionEntities = limitedOptions.map((option) =>
      this.optionRepository.create({
        proposal_id: savedProposal.id,
        kind: option.kind,
        start_at: option.kind === ScheduleOptionKind.EXACT ? (option.startAt ?? null) : null,
        end_at: option.kind === ScheduleOptionKind.EXACT ? (option.endAt ?? null) : null,
        date: option.kind === ScheduleOptionKind.SLOT ? (option.date ?? null) : null,
        slot: option.kind === ScheduleOptionKind.SLOT ? (option.slot ?? null) : null,
        label: option.label,
      }),
    );
    const savedOptions = await this.optionRepository.save(optionEntities);

    const opponentId =
      challenge.challenger_id === proposer.id ? challenge.challenged_id : challenge.challenger_id;
    const opponent = await this.playerRepository.findOne({
      where: { id: opponentId },
    });
    if (opponent) {
      await this.whatsappClient.sendScheduleOptions(opponent.phone_e164, {
        matchId: match.id,
        options: savedOptions,
      });
    }

    await this.auditService.log("Match", match.id, "schedule_propose", proposer.phone_e164, {
      proposalId: savedProposal.id,
    });

    return { ok: true };
  }

  async selectOption(optionId: string, selector: Player): Promise<ScheduleSelectionResult> {
    const option = await this.optionRepository.findOne({
      where: { id: optionId },
      relations: { proposal: true },
    });
    if (!option) {
      return { ok: false, reason: "Opcion no encontrada." };
    }

    const match = await this.matchRepository.findOne({
      where: { id: option.proposal.match_id },
    });
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    const challenge = await this.challengeRepository.findOne({
      where: { id: match.challenge_id },
    });
    if (!challenge) {
      return { ok: false, reason: "Desafio no encontrado." };
    }

    if (challenge.challenger_id === selector.id) {
      return { ok: false, reason: "Solo el desafiado puede seleccionar agenda." };
    }

    if (match.status !== MatchStatus.PENDING_SCHEDULE) {
      return { ok: false, reason: "El match no acepta selecciones." };
    }

    match.selected_schedule_option_id = option.id;
    if (option.kind === ScheduleOptionKind.EXACT) {
      match.scheduled_start_at = option.start_at;
      match.scheduled_date = option.start_at ? option.start_at.toISOString().slice(0, 10) : null;
      match.scheduled_slot = null;
    } else {
      match.scheduled_date = option.date;
      match.scheduled_slot = option.slot;
      match.scheduled_start_at = null;
    }
    match.status = MatchStatus.SCHEDULED;
    await this.matchRepository.save(match);

    await this.proposalRepository.update(
      { match_id: match.id, status: ScheduleProposalStatus.OPEN },
      { status: ScheduleProposalStatus.REPLACED },
    );
    await this.proposalRepository.update(
      { id: option.proposal_id },
      { status: ScheduleProposalStatus.SELECTED },
    );

    await this.auditService.log("Match", match.id, "schedule_select", selector.phone_e164, {
      optionId: option.id,
    });

    return { ok: true };
  }
}
