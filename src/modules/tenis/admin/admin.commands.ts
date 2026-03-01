import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Match } from "../entities/match.entity";
import { Player } from "../entities/player.entity";
import { ExportSheetsJob } from "../jobs/export-sheets.job";
import { ResultService } from "../services/result.service";
import { MatchStatus } from "../tenis.enums";

export interface AdminCommandResult {
  ok: boolean;
  message: string;
}

@Injectable()
export class AdminCommands {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly resultService: ResultService,
    private readonly exportSheetsJob: ExportSheetsJob,
  ) {}

  async execute(commandText: string, actorPhone: string): Promise<AdminCommandResult> {
    const text = commandText.trim();

    if (text.startsWith("/cancha")) {
      return this.handleCourtCommand(text);
    }

    if (text.startsWith("/walkover")) {
      return this.handleWalkover(text, actorPhone);
    }

    if (text.startsWith("/disputa")) {
      return this.handleDispute(text, actorPhone);
    }

    if (text.startsWith("/match")) {
      return this.handleMatch(text, actorPhone);
    }

    if (text.startsWith("/export")) {
      return this.handleExport(text);
    }

    return { ok: false, message: "Comando admin no reconocido." };
  }

  private async handleCourtCommand(text: string): Promise<AdminCommandResult> {
    const match = text.match(/^\/cancha\s+ok\s+(\S+)(?:\s+(\d{1,2}:\d{2}))?$/i);
    if (!match) {
      return {
        ok: false,
        message: "Formato: /cancha ok <matchId> [hh:mm]",
      };
    }

    const matchId = match[1];
    const time = match[2] ?? null;
    const entity = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!entity) {
      return { ok: false, message: "Match no encontrado." };
    }

    if (time && entity.scheduled_date) {
      const dateTime = `${entity.scheduled_date}T${time}:00.000Z`;
      entity.scheduled_start_at = new Date(dateTime);
    }

    entity.status = MatchStatus.SCHEDULED;
    await this.matchRepository.save(entity);
    return { ok: true, message: "Cancha confirmada." };
  }

  private async handleWalkover(text: string, actorPhone: string): Promise<AdminCommandResult> {
    const match = text.match(/^\/walkover\s+(\S+)\s+ganador=(\S+)$/i);
    if (!match) {
      return {
        ok: false,
        message: "Formato: /walkover <matchId> ganador=<telefono>",
      };
    }

    const matchId = match[1];
    const phone = match[2];
    const winner = await this.playerRepository.findOne({
      where: { phone_e164: phone },
    });
    if (!winner) {
      return { ok: false, message: "Jugador no encontrado." };
    }

    const result = await this.resultService.applyWalkover(matchId, winner.id, actorPhone);
    return {
      ok: result.ok,
      message: result.ok ? "Walkover aplicado." : (result.reason ?? "Error."),
    };
  }

  private async handleDispute(text: string, actorPhone: string): Promise<AdminCommandResult> {
    const match = text.match(/^\/disputa\s+resolver\s+(\S+)\s+(.+)$/i);
    if (!match) {
      return {
        ok: false,
        message: "Formato: /disputa resolver <matchId> 6-4 6-2",
      };
    }

    const matchId = match[1];
    const score = match[2];
    const result = await this.resultService.resolveDispute(matchId, score, actorPhone);
    return {
      ok: result.ok,
      message: result.ok ? "Disputa resuelta." : (result.reason ?? "Error."),
    };
  }

  private async handleMatch(text: string, actorPhone: string): Promise<AdminCommandResult> {
    const match = text.match(/^\/match\s+cancelar\s+(\S+)$/i);
    if (!match) {
      return {
        ok: false,
        message: "Formato: /match cancelar <matchId>",
      };
    }

    const matchId = match[1];
    const result = await this.resultService.cancelMatch(matchId, actorPhone);
    return {
      ok: result.ok,
      message: result.ok ? "Match cancelado." : (result.reason ?? "Error."),
    };
  }

  private async handleExport(text: string): Promise<AdminCommandResult> {
    const match = text.match(/^\/export\s+sheets$/i);
    if (!match) {
      return { ok: false, message: "Formato: /export sheets" };
    }

    await this.exportSheetsJob.runNow();
    return { ok: true, message: "Export encolado." };
  }
}
