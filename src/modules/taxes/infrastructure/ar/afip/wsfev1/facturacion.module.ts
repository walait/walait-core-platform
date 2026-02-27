import { FacturacionBuilder } from "./builder/facturacion.builder";
import { FacturacionService } from "./services/facturacion.service";
import { Module } from "@nestjs/common";
import { WsaaModule } from "../auth/wsaa/wsaa.module";
import { Wsfev1Client } from "./wsfev1.client";
import { Wsfev1Controller } from "@/modules/taxes/interfaces/http/wsfev1.controller";
import { Wsfev1Service } from "./services/wsfev1.service";

@Module({
  imports: [WsaaModule],
  controllers: [Wsfev1Controller],
  providers: [
    Wsfev1Service,
    Wsfev1Client,
    FacturacionBuilder,
    FacturacionService,
  ],
  exports: [],
})
export class FacturacionDigitalModule {}
