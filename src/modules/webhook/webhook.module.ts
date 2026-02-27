import { ParserModule } from '@/modules/parser/parser.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookSignatureGuard } from './webhook-signature.guard';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [ConfigModule, ParserModule, StorageModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookSignatureGuard],
})
export class WebhookModule {}
