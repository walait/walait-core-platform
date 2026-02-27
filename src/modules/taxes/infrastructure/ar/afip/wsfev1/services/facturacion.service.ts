import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFile } from "fs/promises";
import { WsaaService } from "../../auth/wsaa/service/wsaa.service";
import {
  type AuthData,
  FacturacionBuilder,
  type InvoiceRequest,
} from "../builder/facturacion.builder";
import { AlicIva } from "../consts/alicuotas";
import { Consumers } from "../consts/consumers";
import { DocIds } from "../consts/docId";
import { Comprobantes } from "../consts/tiposComprobantes";
import { TiposAlicuotaIva } from "../enums/TiposAlicuotaIva.enum";
import { TiposComprobantes } from "../enums/comprobantes.enum";
import { Conceptos } from "../enums/conceptos.enum";
import { Wsfev1Client } from "../wsfev1.client";
import { Wsfev1Service } from "./wsfev1.service";

export interface SubmitElectronicInvoiceInput {
  transaction: {
    amount: {
      value: string;
      currency: string;
    };
  };
  buyer: {
    doc_id: string;
    doc_type: string;
  };
  seller: {
    tax_id: string;
    pos_id: number;
  };
  creation_date: "2025-07-14T00:00:00Z";
  invoice_type: string; // e.g., 'invoiceB'
}

@Injectable()
export class FacturacionService {
  private readonly logger = new Logger(FacturacionService.name);

  constructor(
    @Inject(Wsfev1Service) private readonly wsfev1Service: Wsfev1Service,
  ) {}

  async submitElectronicInvoiceForCAEApproval(
    input: SubmitElectronicInvoiceInput,
    authData: AuthData,
  ) {
    const invoiceType = TiposComprobantes[input.invoice_type || "invoiceA"];
    const invoiceTypeSelected = Comprobantes[invoiceType];

    const consumerType = Consumers[invoiceType];

    const docType = DocIds(input.buyer.doc_type.toUpperCase());

    const lastInvoice = await this.wsfev1Service.getLastInvoice({
      token: authData.token,
      sign: authData.sign,
      cuit: authData.cuit,
      ptoVta: input.seller.pos_id,
      cbteTipo: invoiceTypeSelected.factura,
    });

    const currencyTypes = await this.wsfev1Service.getCurrencyTypes({
      token: authData.token,
      sign: authData.sign,
      cuit: authData.cuit,
    });

    const formatDate = (date: Date | string): string =>
      new Date(date).toISOString().split("T")[0].replace(/-/g, "");

    const iva21 = AlicIva[TiposAlicuotaIva.Iva21];
    const cbteNro = lastInvoice?.CbteNro ? lastInvoice?.CbteNro + 1 : 1;

    const total = +input.transaction.amount.value;
    const ivaRate = iva21.importe / 100;
    const ivaBase = total / (1 + ivaRate);
    const ivaAmount = total - ivaBase;
    const importeNeto = ivaBase;

    const currency =
      input.transaction.amount.currency === "ARS"
        ? "PES"
        : input.transaction.amount.currency;
    const currencySelected = currencyTypes.Moneda.find(
      (c: any) => c.Id === currency,
    );

    if (!currencySelected) {
      throw new Error(`Currency type ${currency} not found`);
    }

    let currencyValue = 1;

    if (!["ARS", "PES"].includes(currencySelected.Id)) {
      const getCotizacion = await this.wsfev1Service.getExchangeRate(
        {
          token: authData.token,
          sign: authData.sign,
          cuit: authData.cuit,
        },
        currencySelected.Id,
      );

      currencyValue = getCotizacion?.MonCotiz ?? 1; // Default to 1 for ARS
    }

    const invoice: InvoiceRequest = {
      token: authData.token,
      sign: authData.sign,
      cuit: authData.cuit,
      header: {
        recordCount: 1,
        salesPoint: input.seller.pos_id,
        receiptType: invoiceTypeSelected.factura,
      },
      details: {
        concept: Conceptos.Servicio,
        documentType: docType.Id.toString(),
        documentNumber: input.buyer.doc_id,
        receiptNumberFrom: String(cbteNro).padStart(8, "0"),
        receiptNumberTo: String(cbteNro).padStart(8, "0"),
        receiptDate: formatDate(input.creation_date || new Date()),
        totalAmount: total,
        nonTaxedAmount: 0,
        netAmount: importeNeto,
        exemptAmount: 0,
        tributesAmount: 0,
        totalIvaAmount: ivaAmount,
        currencyId: currencySelected.Id,
        exchangeRate: currencyValue, // Default to 1 for ARS
        ivaReceptor:
          consumerType?.consumidorFinal ??
          consumerType?.ivaResponsableInscripto,
        service: {
          from: formatDate(input.creation_date || new Date()),
          to: formatDate(input.creation_date || new Date()),
          paymentDue: formatDate(input.creation_date || new Date()),
        },
      },
      iva: {
        id: iva21.id,
        baseAmount: importeNeto,
        amount: ivaAmount,
      },
    };

    this.logger.debug("Submitting electronic invoice for CAE approval", input);
    const response =
      await this.wsfev1Service.submitElectronicInvoiceForCAEApproval(invoice);
  }
}
