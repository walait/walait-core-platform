import type { Payment } from './payment.interface';
import type { TaxTicket } from './ticket.interface';

export interface ITaxProvider {
  /** Devuelve true si este provider puede procesar el país */
  canHandle(countryIso: string): boolean;

  /** Procesa el pago y devuelve el comprobante */
  process(payment: Payment): Promise<TaxTicket>;
}
