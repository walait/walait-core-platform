import { Wsfev1Controller } from '@/modules/taxes/interfaces/http/wsfev1.controller';
import { Module } from '@nestjs/common';
import { AfipAuthModule } from '../auth/afip-auth.module';
import { WsaaModule } from '../auth/wsaa/wsaa.module';
import { SharedTaxesAR } from '../shared/shared.module';
import { FacturacionBuilder } from './builder/facturacion.builder';
import { FacturacionService } from './services/facturacion.service';
import { Wsfev1Service } from './services/wsfev1.service';
import { Wsfev1Client } from './wsfev1.client';

@Module({
  imports: [WsaaModule, SharedTaxesAR],
  controllers: [Wsfev1Controller],
  providers: [Wsfev1Service, Wsfev1Client, FacturacionBuilder, FacturacionService],
  exports: [],
})
export class FacturacionDigitalModule {}
