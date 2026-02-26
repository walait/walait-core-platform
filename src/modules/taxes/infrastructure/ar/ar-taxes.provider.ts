import type { Payment } from '@/modules/taxes/domain/payment.interface';
import type { ITaxProvider } from '@/modules/taxes/domain/provider.interface';
import type { TaxTicket } from '@/modules/taxes/domain/ticket.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ArTaxesProvider implements ITaxProvider {
  constructor() {}

  canHandle(countryIso: string): boolean {
    return countryIso === 'AR';
  }

  async process(payment: Payment): Promise<TaxTicket> {
    if (!payment.afipCredentials) {
      throw new Error('Faltan credenciales AFIP en el pago');
    }

    // const ta = await this.afipAuth.getTokenAndSign('wsfe', payment.afipCredentials);

    return {
      externalId: payment.id,
      issuedAt: new Date(),
      expiresAt: new Date(),
    };
  }
}
