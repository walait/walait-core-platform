import { Module } from "@nestjs/common";
import { PkiModule } from "../cert/modules/pki/pki.module";
import { SharedModule } from "@/shared/shared.module";
import { TicketBuilder } from "./builder/ticket.builder";
import { TicketSigner } from "./signer/ticket.signer";
import { TokenStore } from "./store/token.store";
import { WsaaController } from "@/modules/taxes/interfaces/http/wsaa.controller";
import { WsaaService } from "./service/wsaa.service";
import { WsaaSoapClient } from "./wsaa.client";

@Module({
  providers: [
    WsaaService,
    TicketBuilder,
    WsaaSoapClient,
    TicketSigner,
    TokenStore,
  ],
  imports: [
    SharedModule,
    PkiModule.register({
      opensslPath: "/opt/homebrew/bin/openssl",
      keySize: 4096,
    }),
  ],
  exports: [WsaaService],
  controllers: [WsaaController],
})
export class WsaaModule {}
