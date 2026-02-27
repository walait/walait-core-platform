// src/constants/comprobantes.ts
import { TiposComprobantes } from '../enums/comprobantes.enum';

export const Comprobantes = {
  [TiposComprobantes.invoiceA]: {
    factura: 1,
    nota_de_debito: 2,
    nota_de_credito: 3,
    recibo: 4,
    nota_venta_contado: 5,
    factura_exportacion: 34,
    otros: 39,
    cta_venta_liq_prod: 60,
    liquidacion: 63,
    factura_mipymes: 201,
    nota_debito_mipymes: 202,
    nota_credito_mipymes: 203,
  },
  [TiposComprobantes.invoiceB]: {
    factura: 6,
    nota_de_debito: 7,
    nota_de_credito: 8,
    recibo: 9,
    nota_venta_contado: 10,
    factura_monotributo: 35,
    otros: 40,
    cta_venta_liq_prod: 61,
    liquidacion: 64,
    factura_mipymes: 206,
    nota_debito_mipymes: 207,
    nota_credito_mipymes: 208,
  },
  [TiposComprobantes.invoiceC]: {
    factura: 11,
    nota_de_debito: 12,
    nota_de_credito: 13,
    recibo: 15,
    factura_mipymes: 211,
    nota_debito_mipymes: 212,
    nota_credito_mipymes: 213,
  },
  [TiposComprobantes.invoiceM]: {
    factura: 51,
    nota_de_debito: 52,
    nota_de_credito: 53,
    recibo: 54,
  },
  [TiposComprobantes.UsedGoods]: {
    comprobante: 49,
  },
} as const;
