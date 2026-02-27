import { Inject, Injectable, Logger } from "@nestjs/common";
import { Payment } from "../domain/payment.interface";
import { ITaxProvider } from "../domain/provider.interface";
import { TAX_PROVIDERS } from "../domain/taxes.const";
import { TaxTicket } from "../domain/ticket.interface";

@Injectable()
export class TaxesService {
  private readonly logger = new Logger(TaxesService.name);

  constructor(
    @Inject(TAX_PROVIDERS)
    private readonly providers: ITaxProvider[],
  ) {}

  /**
   * Procesa un pago utilizando el provider adecuado según el país.
   */
  async processPayment(payment: Payment): Promise<TaxTicket> {
    const provider = this.providers.find((p) =>
      p.canHandle(payment.countryIso),
    );

    if (!provider) {
      throw new Error(
        `No tax provider found for country ${payment.countryIso}`,
      );
    }

    this.logger.log(
      `Delegando pago ${payment.id} a ${provider.constructor.name}`,
    );
    return provider.process(payment);
  }
}
