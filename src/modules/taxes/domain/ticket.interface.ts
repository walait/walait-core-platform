export interface TaxTicket {
  externalId: string; // CAE, CAEA o equivalente
  issuedAt: Date;
  expiresAt: Date;
  rawXml?: string; // Respuesta completa del organismo
}
