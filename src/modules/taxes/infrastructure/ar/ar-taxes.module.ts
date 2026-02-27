import { ArTaxesProvider } from "./ar-taxes.provider";
import { CertModule } from "./afip/auth/cert/cert.module";
import { FacturacionDigitalModule } from "./afip/wsfev1/facturacion.module";
import { Module } from "@nestjs/common";
import { TAX_PROVIDERS } from "../../domain/taxes.const";
import { WsaaModule } from "./afip/auth/wsaa/wsaa.module";

@Module({
  imports: [WsaaModule, CertModule, FacturacionDigitalModule],
  providers: [
    ArTaxesProvider,
    {
      provide: TAX_PROVIDERS,
      useExisting: ArTaxesProvider,
    },
  ],
  exports: [TAX_PROVIDERS],
})
export class ArTaxesModule {}
