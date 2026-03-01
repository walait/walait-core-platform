import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminApiKeyGuard } from "./admin/admin-api-key.guard";
import { AdminCommands } from "./admin/admin.commands";
import { TenisAdminController } from "./admin/tenis-admin.controller";
import { AuditLog } from "./entities/audit-log.entity";
import { Challenge } from "./entities/challenge.entity";
import { ConversationState } from "./entities/conversation-state.entity";
import { Dispute } from "./entities/dispute.entity";
import { InboundMessage } from "./entities/inbound-message.entity";
import { Match } from "./entities/match.entity";
import { MonthlyLimits } from "./entities/monthly-limits.entity";
import { PlayerAlias } from "./entities/player-alias.entity";
import { PlayerRole } from "./entities/player-role.entity";
import { PlayerStats } from "./entities/player-stats.entity";
import { Player } from "./entities/player.entity";
import { ResultReport } from "./entities/result-report.entity";
import { ScheduleOption } from "./entities/schedule-option.entity";
import { ScheduleProposal } from "./entities/schedule-proposal.entity";
import { OpenAiRoutingService } from "./integrations/openai-routing.service";
import { SheetsClient } from "./integrations/sheets.client";
import { WhatsAppClient } from "./integrations/whatsapp.client";
import { ExpireChallengeJob } from "./jobs/expire-challenge.job";
import { ExpireScheduleJob } from "./jobs/expire-schedule.job";
import { ExportSheetsJob } from "./jobs/export-sheets.job";
import { AuditService } from "./services/audit.service";
import { ChallengeService } from "./services/challenge.service";
import { LimitsService } from "./services/limits.service";
import { MatchService } from "./services/match.service";
import { PlayerAliasService } from "./services/player-alias.service";
import { PlayerSearchService } from "./services/player-search.service";
import { PlayerService } from "./services/player.service";
import { RankingService } from "./services/ranking.service";
import { ResultService } from "./services/result.service";
import { ScheduleService } from "./services/schedule.service";
import { TenisRouterService } from "./tenis.router.service";
import { TenisService } from "./tenis.service";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Player,
      PlayerAlias,
      PlayerRole,
      PlayerStats,
      MonthlyLimits,
      Challenge,
      Match,
      ScheduleProposal,
      ScheduleOption,
      ResultReport,
      Dispute,
      AuditLog,
      ConversationState,
      InboundMessage,
    ]),
  ],
  controllers: [TenisAdminController],
  providers: [
    TenisService,
    TenisRouterService,
    PlayerService,
    PlayerAliasService,
    PlayerSearchService,
    LimitsService,
    RankingService,
    ChallengeService,
    MatchService,
    ScheduleService,
    ResultService,
    AuditService,
    WhatsAppClient,
    SheetsClient,
    OpenAiRoutingService,
    ExpireChallengeJob,
    ExportSheetsJob,
    ExpireScheduleJob,
    AdminCommands,
    AdminApiKeyGuard,
  ],
  exports: [TenisService],
})
export class TenisModule {}
