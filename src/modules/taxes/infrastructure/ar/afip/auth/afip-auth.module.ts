import { Module } from '@nestjs/common';
import { SharedTaxesAR } from '../shared/shared.module';
import { FacturacionDigitalModule } from '../wsfev1/facturacion.module';
import { CertModule } from './cert/cert.module';
import { WsaaModule } from './wsaa/wsaa.module';

@Module({
  imports: [WsaaModule, CertModule, SharedTaxesAR, FacturacionDigitalModule],
  providers: [],
  exports: [],
})
export class AfipAuthModule {}
