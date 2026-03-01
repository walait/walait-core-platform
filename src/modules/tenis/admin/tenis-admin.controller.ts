import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Match } from "../entities/match.entity";
import { Player } from "../entities/player.entity";
import { ExportSheetsJob } from "../jobs/export-sheets.job";
import { MatchService } from "../services/match.service";
import { ResultService } from "../services/result.service";
import { MatchStatus } from "../tenis.enums";
import { AdminApiKeyGuard } from "./admin-api-key.guard";

@UseGuards(AdminApiKeyGuard)
@Controller("admin/tenis")
export class TenisAdminController {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly matchService: MatchService,
    private readonly resultService: ResultService,
    private readonly exportSheetsJob: ExportSheetsJob,
  ) {}

  @Post("export")
  async exportSheets(): Promise<{ ok: boolean }> {
    await this.exportSheetsJob.runNow();
    return { ok: true };
  }

  @Post("walkover")
  async walkover(
    @Body() body: { matchId: string; winnerPhone: string },
  ): Promise<{ ok: boolean; reason?: string }> {
    const winner = await this.playerRepository.findOne({
      where: { phone_e164: body.winnerPhone },
    });
    if (!winner) {
      return { ok: false, reason: "Jugador no encontrado." };
    }

    const result = await this.resultService.applyWalkover(body.matchId, winner.id);
    return { ok: result.ok, reason: result.reason };
  }

  @Post("disputa/resolve")
  async resolveDispute(
    @Body() body: { matchId: string; score: string },
  ): Promise<{ ok: boolean; reason?: string }> {
    const result = await this.resultService.resolveDispute(body.matchId, body.score);
    return { ok: result.ok, reason: result.reason };
  }

  @Post("match/cancel")
  async cancelMatch(@Body() body: { matchId: string }): Promise<{ ok: boolean; reason?: string }> {
    const result = await this.resultService.cancelMatch(body.matchId);
    return { ok: result.ok, reason: result.reason };
  }

  @Post("cancha/ok")
  async confirmCourt(
    @Body() body: { matchId: string; time?: string },
  ): Promise<{ ok: boolean; reason?: string }> {
    const match = await this.matchService.getMatch(body.matchId);
    if (!match) {
      return { ok: false, reason: "Match no encontrado." };
    }

    if (body.time && match.scheduled_date) {
      match.scheduled_start_at = new Date(`${match.scheduled_date}T${body.time}:00.000Z`);
    }
    match.status = MatchStatus.SCHEDULED;
    await this.matchService.save(match);
    return { ok: true };
  }
}
