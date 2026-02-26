import { WsaaController } from '@/modules/taxes/interfaces/http/wsaa.controller';
import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import { PkiModule } from '../cert/modules/pki/pki.module';
import { TicketBuilder } from './builder/ticket.builder';
import { WsaaService } from './service/wsaa.service';
import { TicketSigner } from './signer/ticket.signer';
import { TokenStore } from './store/token.store';
import { WsaaSoapClient } from './wsaa.client';

@Module({
  providers: [WsaaService, TicketBuilder, TicketSigner, WsaaSoapClient, TokenStore],
  imports: [
    SharedModule,
    PkiModule.register({
      opensslPath: '/opt/homebrew/bin/openssl',
      keySize: 4096,
    }),
  ], // ✅ agregá esto
  exports: [WsaaService, WsaaSoapClient],
  controllers: [WsaaController],
})
export class WsaaModule {}
