import { NormalizedEvent } from "@/modules/parser/parser.types";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminCommands } from "./admin/admin.commands";
import { Challenge } from "./entities/challenge.entity";
import { ConversationState } from "./entities/conversation-state.entity";
import { Match } from "./entities/match.entity";
import { PlayerRole } from "./entities/player-role.entity";
import { Player } from "./entities/player.entity";
import { OpenAiRoutingService } from "./integrations/openai-routing.service";
import { WhatsAppClient } from "./integrations/whatsapp.client";
import { ChallengeService } from "./services/challenge.service";
import { MatchService } from "./services/match.service";
import { PlayerAliasService } from "./services/player-alias.service";
import { PlayerSearchService } from "./services/player-search.service";
import { RankingService } from "./services/ranking.service";
import { ResultService } from "./services/result.service";
import { ScheduleService } from "./services/schedule.service";
import { ConversationFlowState, ScheduleOptionKind, ScheduleSlot } from "./tenis.enums";
import { TenisIntent, TenisIntentResult } from "./tenis.intents";
import { ScheduleOptionInput } from "./tenis.types";

type ParsedCommand =
  | { kind: "challenge_create"; query: string }
  | { kind: "challenge_accept"; challengeId?: string }
  | { kind: "challenge_reject"; challengeId?: string }
  | { kind: "schedule_propose"; matchId: string; options: ScheduleOptionInput[] }
  | { kind: "schedule_select"; optionId: string }
  | { kind: "select_player"; playerId: string }
  | { kind: "result_report"; matchId: string; score: string }
  | { kind: "result_confirm"; reportId: string }
  | { kind: "result_reject"; reportId: string }
  | { kind: "ranking" }
  | { kind: "help" }
  | { kind: "alias_set"; alias: string }
  | { kind: "alias_list" }
  | { kind: "alias_remove"; alias: string }
  | { kind: "admin"; text: string }
  | { kind: "unknown" };

@Injectable()
export class TenisRouterService {
  constructor(
    @InjectRepository(ConversationState)
    private readonly stateRepository: Repository<ConversationState>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(PlayerRole)
    private readonly roleRepository: Repository<PlayerRole>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    private readonly challengeService: ChallengeService,
    private readonly scheduleService: ScheduleService,
    private readonly resultService: ResultService,
    private readonly rankingService: RankingService,
    private readonly matchService: MatchService,
    private readonly whatsappClient: WhatsAppClient,
    private readonly openAiRoutingService: OpenAiRoutingService,
    private readonly playerAliasService: PlayerAliasService,
    private readonly playerSearchService: PlayerSearchService,
    private readonly adminCommands: AdminCommands,
  ) {}

  async route(
    player: Player,
    event: NormalizedEvent,
    options?: { isNew?: boolean },
  ): Promise<void> {
    const conversation = await this.stateRepository.findOne({
      where: { player_id: player.id },
    });

    if (options?.isNew) {
      await this.whatsappClient.sendTextMessage(
        player.phone_e164,
        "Registro creado. Usa /ayuda para ver los comandos.",
      );
    }
    let command = this.parseEvent(event);

    if (command.kind === "unknown") {
      const heuristic = this.applyHeuristics(event.text ?? "");
      if (heuristic) {
        command = heuristic;
      } else {
        const handled = await this.handleAiRouting(
          player,
          event,
          conversation?.state ?? ConversationFlowState.IDLE,
          conversation?.context ?? {},
        );
        if (handled) {
          return;
        }
      }
    }
    if (command.kind === "admin") {
      const role = await this.roleRepository.findOne({
        where: { phone_e164: player.phone_e164, is_active: true },
      });
      if (!role) {
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "No tenes permisos para comandos admin.",
        );
        return;
      }

      const result = await this.adminCommands.execute(command.text, player.phone_e164);
      await this.whatsappClient.sendTextMessage(player.phone_e164, result.message);
      return;
    }

    switch (command.kind) {
      case "challenge_create": {
        const query = command.query.trim();
        if (!query) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "Formato: /desafio <telefono|nombre|apodo>",
          );
          return;
        }

        const search = await this.playerSearchService.searchOpponents(query, player.id);
        if (search.matches.length === 0) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "No encontre ese jugador. Si es nuevo, que te escriba primero.",
          );
          return;
        }

        if (search.matches.length > 1) {
          await this.setPendingAction(player.id, "challenge_create", search.matches);
          await this.sendPlayerSelection(player, search.matches);
          return;
        }

        const challenged = search.matches[0];
        await this.createChallengeFor(player, challenged);
        return;
      }
      case "challenge_accept": {
        const challengeId = command.challengeId ?? (await this.getCurrentChallengeId(player.id));
        if (!challengeId) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "No encontre un desafio para aceptar.",
          );
          return;
        }

        const result = await this.challengeService.acceptChallenge(challengeId, player);
        if (!result.ok) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            result.reason ?? "No se pudo aceptar el desafio.",
          );
          return;
        }

        const match = await this.matchService.getMatchByChallengeId(challengeId);
        if (match) {
          await this.setState(player.id, ConversationFlowState.AWAITING_SCHEDULE, {
            current_match_id: match.id,
          });
          const challenge = await this.challengeRepository.findOne({
            where: { id: challengeId },
          });
          if (challenge) {
            const challenger = await this.playerRepository.findOne({
              where: { id: challenge.challenger_id },
            });
            if (challenger) {
              await this.setState(challenger.id, ConversationFlowState.AWAITING_SCHEDULE, {
                current_match_id: match.id,
              });
              await this.whatsappClient.sendTextMessage(
                challenger.phone_e164,
                `Desafio aceptado. Propon opciones con /proponer ${match.id} ...`,
              );
            }
          }
        }

        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Desafio aceptado. Espera propuestas de agenda.",
        );
        return;
      }
      case "challenge_reject": {
        const challengeId = command.challengeId ?? (await this.getCurrentChallengeId(player.id));
        if (!challengeId) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "No encontre un desafio para rechazar.",
          );
          return;
        }

        const result = await this.challengeService.rejectChallenge(challengeId, player);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok ? "Desafio rechazado." : (result.reason ?? "No se pudo rechazar."),
        );
        if (result.ok) {
          const challenge = await this.challengeRepository.findOne({
            where: { id: challengeId },
          });
          if (challenge) {
            const challenger = await this.playerRepository.findOne({
              where: { id: challenge.challenger_id },
            });
            if (challenger) {
              await this.whatsappClient.sendTextMessage(
                challenger.phone_e164,
                "Tu desafio fue rechazado.",
              );
            }
          }
        }
        return;
      }
      case "schedule_propose": {
        const matchId = command.matchId || (await this.getCurrentMatchId(player.id)) || "";
        const result = await this.scheduleService.proposeSchedule(matchId, player, command.options);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok
            ? "Propuestas enviadas. Espera seleccion."
            : (result.reason ?? "No se pudo proponer agenda."),
        );
        return;
      }
      case "schedule_select": {
        const result = await this.scheduleService.selectOption(command.optionId, player);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok
            ? "Agenda confirmada. Buen partido."
            : (result.reason ?? "No se pudo seleccionar."),
        );
        if (result.ok) {
          const match = await this.matchRepository.findOne({
            where: { selected_schedule_option_id: command.optionId },
          });
          if (match) {
            const challenge = await this.challengeRepository.findOne({
              where: { id: match.challenge_id },
            });
            if (challenge) {
              const opponentId =
                challenge.challenger_id === player.id
                  ? challenge.challenged_id
                  : challenge.challenger_id;
              const opponent = await this.playerRepository.findOne({
                where: { id: opponentId },
              });
              if (opponent) {
                await this.whatsappClient.sendTextMessage(
                  opponent.phone_e164,
                  "Agenda confirmada. Buen partido.",
                );
              }
            }
            await this.setState(player.id, ConversationFlowState.AWAITING_RESULT_CONFIRMATION, {
              current_match_id: match.id,
            });
            if (challenge) {
              const challenger = await this.playerRepository.findOne({
                where: { id: challenge.challenger_id },
              });
              const challenged = await this.playerRepository.findOne({
                where: { id: challenge.challenged_id },
              });
              if (challenger) {
                await this.setState(
                  challenger.id,
                  ConversationFlowState.AWAITING_RESULT_CONFIRMATION,
                  { current_match_id: match.id },
                );
              }
              if (challenged) {
                await this.setState(
                  challenged.id,
                  ConversationFlowState.AWAITING_RESULT_CONFIRMATION,
                  { current_match_id: match.id },
                );
              }
            }
          }
        }
        return;
      }
      case "select_player": {
        const allowed = await this.isCandidateAllowed(player.id, command.playerId);
        if (!allowed) {
          await this.whatsappClient.sendTextMessage(player.phone_e164, "Esa opcion no es valida.");
          return;
        }

        const challenged = await this.playerRepository.findOne({
          where: { id: command.playerId },
        });
        if (!challenged) {
          await this.whatsappClient.sendTextMessage(player.phone_e164, "Jugador no encontrado.");
          return;
        }

        await this.clearPendingAction(player.id);
        await this.createChallengeFor(player, challenged);
        return;
      }
      case "result_report": {
        const matchId = command.matchId || (await this.getCurrentMatchId(player.id)) || "";
        const result = await this.resultService.reportResult(matchId, player, command.score);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok
            ? "Resultado enviado para confirmacion."
            : (result.reason ?? "No se pudo reportar."),
        );
        return;
      }
      case "result_confirm": {
        const result = await this.resultService.confirmResult(command.reportId, player);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok ? "Resultado confirmado." : (result.reason ?? "No se pudo confirmar."),
        );
        if (result.ok) {
          await this.setState(player.id, ConversationFlowState.IDLE, {});
        }
        return;
      }
      case "result_reject": {
        const result = await this.resultService.rejectResult(command.reportId, player);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok ? "Resultado rechazado. Se abrio disputa." : (result.reason ?? "Error."),
        );
        if (result.ok) {
          await this.setState(player.id, ConversationFlowState.DISPUTED, {});
        }
        return;
      }
      case "ranking": {
        await this.sendRanking(player);
        return;
      }
      case "help": {
        await this.whatsappClient.sendTextMessage(player.phone_e164, this.helpMessage());
        return;
      }
      case "alias_set": {
        const result = await this.playerAliasService.addAlias(player.id, command.alias);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok
            ? `Apodo guardado: ${command.alias}`
            : (result.reason ?? "No se pudo guardar el apodo."),
        );
        return;
      }
      case "alias_list": {
        const aliases = await this.playerAliasService.listAliases(player.id);
        if (aliases.length === 0) {
          await this.whatsappClient.sendTextMessage(player.phone_e164, "No tenes apodos cargados.");
          return;
        }

        const list = aliases.map((alias) => `- ${alias.alias}`).join("\n");
        await this.whatsappClient.sendTextMessage(player.phone_e164, `Tus apodos:\n${list}`);
        return;
      }
      case "alias_remove": {
        const result = await this.playerAliasService.removeAlias(player.id, command.alias);
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          result.ok
            ? `Apodo eliminado: ${command.alias}`
            : (result.reason ?? "No se pudo eliminar el apodo."),
        );
        return;
      }
      case "unknown": {
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "No entendi. Usa /ayuda para ver comandos.",
        );
        return;
      }
      default:
        return;
    }
  }

  private parseEvent(event: NormalizedEvent): ParsedCommand {
    const interactive = event.interactive?.id;
    if (interactive) {
      return this.parseInteractive(interactive);
    }

    const text = event.text?.trim();
    if (!text) {
      return { kind: "unknown" };
    }

    return this.parseText(text);
  }

  private parseInteractive(id: string): ParsedCommand {
    const [prefix, value] = id.split(":");
    if (prefix === "challenge_accept") {
      return { kind: "challenge_accept", challengeId: value };
    }
    if (prefix === "challenge_reject") {
      return { kind: "challenge_reject", challengeId: value };
    }
    if (prefix === "schedule_select") {
      return { kind: "schedule_select", optionId: value };
    }
    if (prefix === "result_confirm") {
      return { kind: "result_confirm", reportId: value };
    }
    if (prefix === "result_reject") {
      return { kind: "result_reject", reportId: value };
    }
    if (prefix === "select_player") {
      return { kind: "select_player", playerId: value };
    }
    return { kind: "unknown" };
  }

  private parseText(text: string): ParsedCommand {
    if (!text.startsWith("/")) {
      return { kind: "unknown" };
    }

    const [command, ...rest] = text.split(" ");
    const lower = command.toLowerCase();
    const payload = rest.join(" ").trim();

    if (lower === "/desafio") {
      return { kind: "challenge_create", query: payload };
    }
    if (lower === "/aceptar") {
      return { kind: "challenge_accept", challengeId: payload || undefined };
    }
    if (lower === "/rechazar") {
      return { kind: "challenge_reject", challengeId: payload || undefined };
    }
    if (lower === "/proponer") {
      const [matchId, ...options] = payload.split(" ");
      return {
        kind: "schedule_propose",
        matchId,
        options: this.parseScheduleOptions(options.join(" ")),
      };
    }
    if (lower === "/seleccionar") {
      return { kind: "schedule_select", optionId: payload };
    }
    if (lower === "/resultado") {
      const [matchId, ...scoreParts] = payload.split(" ");
      return {
        kind: "result_report",
        matchId,
        score: scoreParts.join(" "),
      };
    }
    if (lower === "/ranking") {
      return { kind: "ranking" };
    }
    if (lower === "/ayuda") {
      return { kind: "help" };
    }
    if (lower === "/apodos") {
      return { kind: "alias_list" };
    }
    if (lower === "/apodo") {
      if (payload.toLowerCase().startsWith("borrar ")) {
        return { kind: "alias_remove", alias: payload.slice(7).trim() };
      }
      return { kind: "alias_set", alias: payload };
    }
    if (
      lower.startsWith("/cancha") ||
      lower.startsWith("/walkover") ||
      lower.startsWith("/disputa") ||
      lower.startsWith("/match") ||
      lower.startsWith("/export")
    ) {
      return { kind: "admin", text };
    }

    return { kind: "unknown" };
  }

  private parseScheduleOptions(payload: string): ScheduleOptionInput[] {
    if (!payload) {
      return [];
    }

    const options = payload
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);

    const parsed: ScheduleOptionInput[] = [];
    for (const option of options) {
      const exactMatch = option.match(/^EXACT:(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/i);
      if (exactMatch) {
        const date = exactMatch[1];
        const time = exactMatch[2];
        const startAt = new Date(`${date}T${time}:00.000Z`);
        parsed.push({
          kind: ScheduleOptionKind.EXACT,
          startAt,
          label: `${date} ${time}`,
        });
      } else {
        const slotMatch = option.match(/^SLOT:(\d{4}-\d{2}-\d{2})\s+(MORNING|AFTERNOON|NIGHT)$/i);
        if (slotMatch) {
          const date = slotMatch[1];
          const slot = slotMatch[2].toUpperCase() as ScheduleSlot;
          parsed.push({
            kind: ScheduleOptionKind.SLOT,
            date,
            slot,
            label: `${date} ${this.slotLabel(slot)}`,
          });
        }
      }
    }

    return parsed;
  }

  private slotLabel(slot: ScheduleSlot): string {
    switch (slot) {
      case ScheduleSlot.MORNING:
        return "MANANA";
      case ScheduleSlot.AFTERNOON:
        return "TARDE";
      case ScheduleSlot.NIGHT:
        return "NOCHE";
      default:
        return slot;
    }
  }

  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      return null;
    }
    return digits;
  }

  private async getCurrentChallengeId(playerId: string): Promise<string | undefined> {
    const state = await this.stateRepository.findOne({
      where: { player_id: playerId },
    });
    const context = (state?.context ?? {}) as Record<string, unknown>;
    const value = context.current_challenge_id;
    return typeof value === "string" ? value : undefined;
  }

  private async sendRanking(player: Player): Promise<void> {
    const ranking = await this.rankingService.getRankingList(10);
    const lines = ranking.map((row) => `${row.rank}. ${row.name} - ${row.points} pts`);
    const message = lines.length > 0 ? lines.join("\n") : "Sin ranking.";
    await this.whatsappClient.sendTextMessage(player.phone_e164, message);
  }

  private applyHeuristics(text: string): ParsedCommand | null {
    const normalized = text.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    if (/(ranking|tabla|posiciones)/i.test(normalized)) {
      return { kind: "ranking" };
    }

    if (/(ayuda|help|comandos)/i.test(normalized)) {
      return { kind: "help" };
    }

    return null;
  }

  private shouldUseAi(state: ConversationFlowState, text: string): boolean {
    if (state !== ConversationFlowState.IDLE) {
      return false;
    }

    const normalized = text.trim();
    if (!normalized || normalized.startsWith("/")) {
      return false;
    }

    return normalized.length >= 3;
  }

  private async handleAiRouting(
    player: Player,
    event: NormalizedEvent,
    state: ConversationFlowState,
    context: Record<string, unknown>,
  ): Promise<boolean> {
    const text = event.text ?? "";
    if (!this.shouldUseAi(state, text)) {
      return false;
    }

    const result = await this.openAiRoutingService.classify(
      text,
      {
        state,
        context,
      },
      player.id,
    );
    if (!result) {
      return false;
    }

    if (result.needs_clarification || result.confidence < 0.75) {
      const message =
        result.clarifying_question ?? "Para continuar, usa /ayuda y elegi un comando.";
      await this.whatsappClient.sendTextMessage(player.phone_e164, message);
      return true;
    }

    return this.applyAiIntent(player, result);
  }

  private async applyAiIntent(player: Player, result: TenisIntentResult): Promise<boolean> {
    switch (result.intent) {
      case TenisIntent.HELP:
        await this.whatsappClient.sendTextMessage(player.phone_e164, this.helpMessage());
        return true;
      case TenisIntent.RANKING_QUERY:
        await this.sendRanking(player);
        return true;
      case TenisIntent.CHALLENGE_CREATE: {
        const query = result.entities.opponent_phone ?? result.entities.opponent_name ?? "";
        if (!query) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "Para desafiar necesito el telefono o nombre. Ejemplo: /desafio 549XXXXXXXXXX",
          );
          return true;
        }

        const search = await this.playerSearchService.searchOpponents(query, player.id);
        if (search.matches.length === 0) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "No encontre ese jugador. Si es nuevo, que te escriba primero.",
          );
          return true;
        }

        if (search.matches.length > 1) {
          await this.setPendingAction(player.id, "challenge_create", search.matches);
          await this.sendPlayerSelection(player, search.matches);
          return true;
        }

        const opponent = search.matches[0];
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          `Para confirmar, envia: /desafio ${opponent.phone_e164}`,
        );
        return true;
      }
      case TenisIntent.CHALLENGE_ACCEPT:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para aceptar, envia /aceptar <challengeId>",
        );
        return true;
      case TenisIntent.CHALLENGE_REJECT:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para rechazar, envia /rechazar <challengeId>",
        );
        return true;
      case TenisIntent.SCHEDULE_PROPOSE:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para proponer agenda, usa /proponer <matchId> EXACT:YYYY-MM-DD HH:MM | SLOT:YYYY-MM-DD MORNING",
        );
        return true;
      case TenisIntent.SCHEDULE_SELECT:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para seleccionar agenda, envia /seleccionar <optionId>",
        );
        return true;
      case TenisIntent.RESULT_REPORT: {
        const matchId = result.entities.match_id;
        const score = result.entities.score;
        if (matchId && score) {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            `Para confirmar, envia: /resultado ${matchId} ${score}`,
          );
        } else {
          await this.whatsappClient.sendTextMessage(
            player.phone_e164,
            "Para reportar resultado: /resultado <matchId> 6-4 6-2",
          );
        }
        return true;
      }
      case TenisIntent.RESULT_CONFIRM:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para confirmar resultado, usa el boton Confirmar.",
        );
        return true;
      case TenisIntent.RESULT_REJECT:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Para rechazar resultado, usa el boton Rechazar.",
        );
        return true;
      case TenisIntent.ADMIN_COMMAND:
        await this.whatsappClient.sendTextMessage(
          player.phone_e164,
          "Comando admin requerido. Usa los comandos con /cancha, /walkover, /disputa o /export.",
        );
        return true;
      default:
        return false;
    }
  }

  private async getCurrentMatchId(playerId: string): Promise<string | undefined> {
    const state = await this.stateRepository.findOne({
      where: { player_id: playerId },
    });
    const context = (state?.context ?? {}) as Record<string, unknown>;
    const value = context.current_match_id;
    return typeof value === "string" ? value : undefined;
  }

  private async createChallengeFor(challenger: Player, challenged: Player): Promise<void> {
    const result = await this.challengeService.createChallenge(challenger, challenged);
    if (!result.ok) {
      await this.whatsappClient.sendTextMessage(
        challenger.phone_e164,
        result.reason ?? "No se pudo crear el desafio.",
      );
      return;
    }

    await this.whatsappClient.sendTextMessage(
      challenger.phone_e164,
      `Desafio enviado a ${challenged.display_name}.`,
    );
    await this.setState(challenger.id, ConversationFlowState.IDLE, {
      current_challenge_id: result.challenge?.id,
    });
    await this.setState(challenged.id, ConversationFlowState.CHALLENGE_RECEIVED, {
      current_challenge_id: result.challenge?.id,
    });
  }

  private async sendPlayerSelection(player: Player, candidates: Player[]): Promise<void> {
    const rows = candidates.slice(0, 10).map((candidate) => ({
      id: `select_player:${candidate.id}`,
      title: `${candidate.display_name} - ${candidate.phone_e164}`,
    }));
    await this.whatsappClient.sendListMessage(player.phone_e164, {
      title: "Selecciona jugador",
      body: "Encontramos varias coincidencias. Elegi una opcion:",
      rows,
    });
  }

  private async setPendingAction(
    playerId: string,
    action: string,
    candidates: Player[],
  ): Promise<void> {
    await this.updateContext(playerId, {
      pending_action: action,
      candidate_ids: candidates.slice(0, 10).map((candidate) => candidate.id),
    });
  }

  private async clearPendingAction(playerId: string): Promise<void> {
    await this.updateContext(playerId, {
      pending_action: null,
      candidate_ids: null,
    });
  }

  private async isCandidateAllowed(playerId: string, candidateId: string): Promise<boolean> {
    const state = await this.stateRepository.findOne({
      where: { player_id: playerId },
    });
    const context = (state?.context ?? {}) as Record<string, unknown>;
    const pendingAction = typeof context.pending_action === "string" ? context.pending_action : "";
    if (pendingAction !== "challenge_create") {
      return false;
    }

    const candidates = Array.isArray(context.candidate_ids)
      ? (context.candidate_ids as string[])
      : [];
    return candidates.includes(candidateId);
  }

  private async updateContext(playerId: string, patch: Record<string, unknown>): Promise<void> {
    const existing = await this.stateRepository.findOne({
      where: { player_id: playerId },
    });
    const current = (existing?.context ?? {}) as Record<string, unknown>;
    const next = { ...current, ...patch };
    if (existing) {
      existing.context = next;
      await this.stateRepository.save(existing);
      return;
    }

    const created = this.stateRepository.create({
      player_id: playerId,
      state: ConversationFlowState.IDLE,
      context: next,
    });
    await this.stateRepository.save(created);
  }

  private async setState(
    playerId: string,
    state: ConversationFlowState,
    context: Record<string, unknown>,
  ): Promise<void> {
    const existing = await this.stateRepository.findOne({
      where: { player_id: playerId },
    });
    if (existing) {
      existing.state = state;
      existing.context = context;
      await this.stateRepository.save(existing);
      return;
    }

    const created = this.stateRepository.create({
      player_id: playerId,
      state,
      context,
    });
    await this.stateRepository.save(created);
  }

  private helpMessage(): string {
    return [
      "Comandos:",
      "/desafio <telefono|nombre|apodo>",
      "/aceptar <challengeId>",
      "/rechazar <challengeId>",
      "/proponer <matchId> EXACT:YYYY-MM-DD HH:MM | SLOT:YYYY-MM-DD MORNING",
      "/seleccionar <optionId>",
      "/resultado <matchId> 6-4 6-2",
      "/ranking",
      "/apodo <alias>",
      "/apodos",
      "/apodo borrar <alias>",
    ].join("\n");
  }
}
