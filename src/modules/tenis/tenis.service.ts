import { NormalizedEvent } from "@/modules/parser/parser.types";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { InboundMessage } from "./entities/inbound-message.entity";
import { PlayerService } from "./services/player.service";
import { TenisRouterService } from "./tenis.router.service";

interface WebhookMetadata {
  requestId?: string;
  sourceIp?: string;
  userAgent?: string;
}

@Injectable()
export class TenisService {
  private readonly logger = new Logger(TenisService.name);

  constructor(
    @InjectRepository(InboundMessage)
    private readonly inboundRepository: Repository<InboundMessage>,
    private readonly playerService: PlayerService,
    private readonly routerService: TenisRouterService,
  ) {}

  async handleEvent(event: NormalizedEvent, metadata?: WebhookMetadata): Promise<void> {
    if (event.kind !== "incoming_message") {
      return;
    }

    if (!event.fromWaId) {
      return;
    }

    const ensured = await this.playerService.ensurePlayer(event.fromWaId, event.fromName);

    if (event.waMessageId) {
      const inserted = await this.insertInboundMessage(event, metadata);
      if (!inserted) {
        return;
      }
    }

    await this.routerService.route(ensured.player, event, {
      isNew: ensured.created,
    });
  }

  private async insertInboundMessage(
    event: NormalizedEvent,
    metadata?: WebhookMetadata,
  ): Promise<boolean> {
    const payload =
      typeof event.raw === "object" && event.raw !== null
        ? (event.raw as Record<string, unknown>)
        : { value: event.raw };

    try {
      await this.inboundRepository.insert({
        wa_message_id: event.waMessageId ?? "",
        from_wa_id: event.fromWaId ?? null,
        phone_number_id: event.phoneNumberId ?? null,
        message_type: event.messageType ?? null,
        payload_json: {
          event: payload,
          metadata: metadata ?? {},
        },
      });
      return true;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        this.logger.warn(`Mensaje duplicado ignorado: ${event.waMessageId ?? "unknown"}`);
        return false;
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      return driverError?.code === "23505";
    }

    return false;
  }
}
