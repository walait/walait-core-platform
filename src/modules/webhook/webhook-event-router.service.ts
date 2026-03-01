import { BotHandlerKey } from "@/modules/bot-registry/bot-registry.enums";
import { BotRegistryService } from "@/modules/bot-registry/bot-registry.service";
import { NormalizedEvent } from "@/modules/parser/parser.types";
import { TenisService } from "@/modules/tenis/tenis.service";
import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface WebhookMetadata {
  requestId: string;
  sourceIp?: string;
  userAgent?: string;
}

@Injectable()
export class WebhookEventRouter {
  constructor(
    private readonly configService: ConfigService,
    private readonly botRegistryService: BotRegistryService,
    @Optional() private readonly tenisService?: TenisService,
  ) {}

  async route(event: NormalizedEvent, metadata: WebhookMetadata): Promise<void> {
    if (event.kind !== "incoming_message") {
      return;
    }

    const phoneNumberId = event.phoneNumberId;
    if (!phoneNumberId) {
      return;
    }

    const handlerKey = await this.botRegistryService.getHandlerKey(phoneNumberId);
    if (handlerKey === BotHandlerKey.TENIS) {
      await this.handleTenis(event, metadata);
      return;
    }

    const fallbackTenisPhoneNumberId =
      this.configService.get<string>("TENIS_PHONE_NUMBER_ID") ??
      this.configService.get<string>("whatsapp.phoneNumberId") ??
      "";
    if (fallbackTenisPhoneNumberId && phoneNumberId === fallbackTenisPhoneNumberId) {
      await this.handleTenis(event, metadata);
    }
  }

  private async handleTenis(event: NormalizedEvent, metadata: WebhookMetadata): Promise<void> {
    if (this.tenisService) {
      await this.tenisService.handleEvent(event, metadata);
    }
  }
}
