import { randomUUID } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import type { XMLBuilder } from 'xmlbuilder2/lib/interfaces';

export interface AuthData {
  token: string;
  sign: string;
  cuit: string;
}

export interface Header {
  recordCount: number;
  salesPoint: number;
  receiptType: number;
}

export interface ServiceDates {
  from: string; // Format: YYYYMMDD
  to: string; // Format: YYYYMMDD
  paymentDue: string; // Format: YYYYMMDD
}

export interface Detail {
  concept: number;
  documentType: string;
  documentNumber: string;
  receiptNumberFrom: string;
  receiptNumberTo: string;
  receiptDate: string;
  totalAmount: number;
  nonTaxedAmount: number;
  netAmount: number;
  exemptAmount: number;
  tributesAmount: number;
  totalIvaAmount: number;
  currencyId: number;
  exchangeRate: number;
  ivaReceptor: number;
  service?: ServiceDates;
}

export interface InvoiceRequest extends AuthData {
  header: Header;
  details: Detail;
  iva: {
    id: number;
    baseAmount: number;
    amount: number;
  };
}

@Injectable()
export class FacturacionBuilder {
  private wrapWithSoapEnvelope(inner: XMLBuilder): XMLBuilder {
    const envelope = create({ version: '1.0', encoding: 'UTF-8' }).ele('soap:Envelope', {
      'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
      'xmlns:ar': 'http://ar.gov.afip.dif.FEV1/',
    });

    envelope.ele('soap:Body').import(inner);
    return envelope;
  }

  private async toTmp(op: string, xml: string) {
    const file = path.join(tmpdir(), `${op}-${randomUUID()}.xml`);
    await writeFile(file, xml);
    return {
      path: file,
      cleanup: async () => {
        try {
          await unlink(file);
        } catch {}
      },
    };
  }

  authBlock(root: string, { token, sign, cuit }: AuthData): XMLBuilder {
    return create()
      .ele(root)
      .ele('ar:Auth')
      .ele('ar:Token')
      .txt(token)
      .up()
      .ele('ar:Sign')
      .txt(sign)
      .up()
      .ele('ar:Cuit')
      .txt(cuit)
      .up()
      .up(); // /Auth
  }

  buildFECAESolicitarXML(data: InvoiceRequest): XMLBuilder {
    const { token, sign, cuit: tax_id, header, details, iva } = data;

    const doc = create().ele('ar:FECAESolicitar');
    doc
      .ele('ar:Auth')
      .ele('ar:Token')
      .txt(token)
      .up()
      .ele('ar:Sign')
      .txt(sign)
      .up()
      .ele('ar:Cuit')
      .txt(tax_id)
      .up()
      .up();

    const feCAEReq = doc.ele('ar:FeCAEReq');
    feCAEReq
      .ele('ar:FeCabReq')
      .ele('ar:CantReg')
      .txt(header.recordCount.toString())
      .up()
      .ele('ar:PtoVta')
      .txt(header.salesPoint.toString())
      .up()
      .ele('ar:CbteTipo')
      .txt(header.receiptType.toString())
      .up()
      .up();

    const det = feCAEReq.ele('ar:FeDetReq').ele('ar:FECAEDetRequest');
    det
      .ele('ar:Concepto')
      .txt(details.concept.toString())
      .up()
      .ele('ar:DocTipo')
      .txt(details.documentType)
      .up()
      .ele('ar:DocNro')
      .txt(details.documentNumber)
      .up()
      .ele('ar:CbteDesde')
      .txt(details.receiptNumberFrom)
      .up()
      .ele('ar:CbteHasta')
      .txt(details.receiptNumberTo)
      .up()
      .ele('ar:CbteFch')
      .txt(details.receiptDate)
      .up()
      .ele('ar:ImpTotal')
      .txt(details.totalAmount.toFixed(2))
      .up()
      .ele('ar:ImpTotConc')
      .txt(details.nonTaxedAmount.toFixed(2))
      .up()
      .ele('ar:ImpNeto')
      .txt(details.netAmount.toFixed(2))
      .up()
      .ele('ar:ImpOpEx')
      .txt(details.exemptAmount.toFixed(2))
      .up()
      .ele('ar:ImpTrib')
      .txt(details.tributesAmount.toFixed(2))
      .up()
      .ele('ar:ImpIVA')
      .txt(details.totalIvaAmount.toFixed(2))
      .up()
      .ele('ar:MonId')
      .txt(details.currencyId.toString())
      .up()
      .ele('ar:MonCotiz')
      .txt(details.exchangeRate.toFixed(4))
      .up()
      .ele('ar:CondicionIVAReceptorId')
      .txt(details.ivaReceptor.toString())
      .up();

    det
      .ele('ar:Iva')
      .ele('ar:AlicIva')
      .ele('ar:Id')
      .txt(iva.id.toString())
      .up()
      .ele('ar:BaseImp')
      .txt(iva.baseAmount.toFixed(2))
      .up()
      .ele('ar:Importe')
      .txt(iva.amount.toFixed(2))
      .up()
      .up()
      .up();

    if (details.service) {
      det.ele('ar:FchServDesde').txt(details.service.from).up();
      det.ele('ar:FchServHasta').txt(details.service.to).up();
      det.ele('ar:FchVtoPago').txt(details.service.paymentDue).up();
    }

    return doc;
  }

  async buildFECAESolicitarFile(data: InvoiceRequest) {
    const inner = this.buildFECAESolicitarXML(data);
    const full = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`FECAESOL-${data.cuit}`, full);
  }

  async buildGetUltimoComprobante(params: AuthData & { ptoVta: number; cbteTipo: number }) {
    const inner = this.authBlock('ar:FECompUltimoAutorizado', params)
      .ele('ar:PtoVta')
      .txt(params.ptoVta.toString())
      .up()
      .ele('ar:CbteTipo')
      .txt(params.cbteTipo.toString())
      .up()
      .up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`ULTIMO-CBTE-${params.cuit}`, xml);
  }

  async buildTiposIva(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetTiposIva', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`TIPOS-IVA-${auth.cuit}`, xml);
  }

  async buildPuntosVenta(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetPtosVenta', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`PUNTOS-VENTA-${auth.cuit}`, xml);
  }

  async buildTiposComprobates(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetTiposCbte', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`TIPOS-COMPROBANTES-${auth.cuit}`, xml);
  }

  async buildGetTiposDocumentos(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetTiposDoc', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`TIPOS-DOC-${auth.cuit}`, xml);
  }

  async buildGetTiposMonedas(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetTiposMonedas', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`TIPOS-MONEDAS-${auth.cuit}`, xml);
  }

  async buildGetCotizacion(auth: AuthData, monedaId: string) {
    const inner = this.authBlock('ar:FEParamGetCotizacion', auth)
      .ele('ar:MonId')
      .txt(monedaId)
      .up()
      .up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`COTIZACION-${auth.cuit}`, xml);
  }

  async buildGetCondicionIvaReceptor(params: AuthData & { cbteTipo: number }) {
    const inner = this.authBlock('ar:FEParamGetCondicionIvaReceptor', params)
      .ele('ar:ClaseCmp')
      .txt(params.cbteTipo.toString())
      .up()
      .up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`CONDICION-IVA-RECEPTOR-${params.cuit}`, xml);
  }

  async buildGetTiposConcepto(auth: AuthData) {
    const inner = this.authBlock('ar:FEParamGetTiposConcepto', auth).up();
    const xml = this.wrapWithSoapEnvelope(inner).end({ prettyPrint: true });
    return this.toTmp(`TIPOS-CONCEPTO-${auth.cuit}`, xml);
  }
}
