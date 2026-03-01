import { ParserService } from "@/modules/parser/parser.service";
import { NormalizedEvent } from "@/modules/parser/parser.types";
import { StorageService } from "@/modules/storage/storage.service";
import { Injectable } from "@nestjs/common";
import { WebhookEventRouter } from "./webhook-event-router.service";

interface WebhookMetadata {
  requestId: string;
  sourceIp?: string;
  userAgent?: string;
}

@Injectable()
export class WebhookService {
  private readonly ttlMs = 6 * 60 * 60 * 1000;
  private readonly seen = new Map<string, number>();

  constructor(
    private readonly parserService: ParserService,
    private readonly storageService: StorageService,
    private readonly eventRouter: WebhookEventRouter,
  ) {}

  async handleWebhook(payload: unknown, metadata: WebhookMetadata): Promise<void> {
    await this.storageService.appendRaw(payload, { ...metadata });

    const events = this.parserService.parse(payload);
    const now = Date.now();
    this.cleanup(now);

    for (const event of events) {
      const duplicate = this.isDuplicate(event, now);
      this.logEvent(metadata.requestId, event, duplicate);
      if (duplicate) {
        continue;
      }

      await this.storageService.appendEvent(event);
      await this.eventRouter.route(event, { ...metadata });
    }
  }

  private isDuplicate(event: NormalizedEvent, now: number): boolean {
    if (!event.waMessageId) {
      return false;
    }

    const lastSeen = this.seen.get(event.waMessageId);
    if (lastSeen && now - lastSeen < this.ttlMs) {
      return true;
    }

    this.seen.set(event.waMessageId, now);
    return false;
  }

  private cleanup(now: number): void {
    for (const [key, timestamp] of this.seen.entries()) {
      if (now - timestamp >= this.ttlMs) {
        this.seen.delete(key);
      }
    }
  }

  private logEvent(requestId: string, event: NormalizedEvent, duplicate: boolean): void {
    const logPayload = {
      requestId,
      kind: event.kind,
      waMessageId: event.waMessageId,
      duplicate,
    };

    console.log(JSON.stringify(logPayload));
  }
}
