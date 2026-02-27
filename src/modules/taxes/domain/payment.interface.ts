export interface Payment {
  id: string;
  countryIso: string; // "AR", "BR", "CL", etc.
  currencyIso: string; // "ARS", "BRL", …
  grossAmount: number;
  date: Date;
  // …cualquier metadato que uses hoy
  afipCredentials?: {
    cert: string; // Contenido del archivo .crt en PEM
    key: string; // Contenido del archivo .key en PEM
    passphrase?: string; // Opcional
  };
}
