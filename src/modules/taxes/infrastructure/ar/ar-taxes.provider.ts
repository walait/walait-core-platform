import { ITaxProvider } from "@/modules/taxes/domain/provider.interface";
import { Injectable } from "@nestjs/common";
import { Payment } from "@/modules/taxes/domain/payment.interface";
import { TaxTicket } from "@/modules/taxes/domain/ticket.interface";

@Injectable()
export class ArTaxesProvider implements ITaxProvider {
  canHandle(countryIso: string): boolean {
    return countryIso === "AR";
  }

  async process(payment: Payment): Promise<TaxTicket> {
    if (!payment.afipCredentials) {
      throw new Error("Faltan credenciales AFIP en el pago");
    }

    // const ta = await this.afipAuth.getTokenAndSign('wsfe', payment.afipCredentials);

    return {
      externalId: payment.id,
      issuedAt: new Date(),
      expiresAt: new Date(),
    };
  }
}
