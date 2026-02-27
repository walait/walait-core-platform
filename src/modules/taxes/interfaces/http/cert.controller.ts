// src/cert/cert.controller.ts
import { Body, Controller, Inject, Post } from "@nestjs/common";
import type { GenerateCsrDto } from "../../infrastructure/ar/afip/auth/cert/modules/pki/dto/generate-csr.dto";
import { PkiService } from "../../infrastructure/ar/afip/auth/cert/modules/pki/services/pki.service";
import { generateStrongPassphrase } from "../../infrastructure/ar/afip/auth/cert/modules/pki/utils";

@Controller("cert")
export class CertController {
  constructor(@Inject(PkiService) private readonly pki: PkiService) {}

  @Post("csr")
  async createCsr(@Body() dto: GenerateCsrDto) {
    const { csrPem } = await this.pki.generateKeyAndCsr(dto);

    return { csrPem }; // o guardalo, encripta, etc.
  }

  @Post("certX509")
  async saveCertX50(@Body() body: any) {
    await this.pki.saveCertX50(body.tax_id, body.afip_cert);

    return {
      message: `Save certX509 successfully for client ${body.tax_id}`,
    };
  }
}
