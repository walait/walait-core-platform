import { BotRegistryModule } from "@/modules/bot-registry/bot-registry.module";
import { ParserModule } from "@/modules/parser/parser.module";
import { StorageModule } from "@/modules/storage/storage.module";
import { TenisModule } from "@/modules/tenis/tenis.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WebhookEventRouter } from "./webhook-event-router.service";
import { WebhookSignatureGuard } from "./webhook-signature.guard";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";

@Module({
  imports: [ConfigModule, BotRegistryModule, ParserModule, StorageModule, TenisModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookSignatureGuard, WebhookEventRouter],
})
export class WebhookModule {}
