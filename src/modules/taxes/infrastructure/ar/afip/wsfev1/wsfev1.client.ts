import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import type { BaseSoapClient } from '../shared/services/baseSoapClient.service';
import { AuthData, type FacturacionBuilder, InvoiceRequest } from './builder/facturacion.builder';

interface InvoiceResponse {
  FeCabResp: {
    Cuit: number;
    PtoVta: number;
    CbteTipo: number;
    FchProceso: number;
    CantReg: number;
    Resultado: string;
  };
  FeDetResp: {
    FECAEDetResponse: {
      Concepto: number;
      DocTipo: number;
      DocNro: number;
      CbteDesde: number;
      CbteHasta: number;
      CbteFch: number;
      Resultado: string;
      CAE: number;
      CAEFchVto: number;
    };
  };
}

@Injectable()
export class Wsfev1Client {
  private readonly logger = new Logger(Wsfev1Client.name);

  constructor(
    private readonly base: BaseSoapClient,
    private readonly builder: FacturacionBuilder,
  ) {}

  async callFeCAE(body: string, wsdl: string, endpoint: string): Promise<InvoiceResponse> {
    return await this.callClient<InvoiceResponse>(body, wsdl, endpoint, 'FECAESolicitar');
  }

  async callClient<T>(body: string, wsdl: string, endpoint: string, method: string): Promise<T> {
    this.logger.debug(`Calling ${method} on ${endpoint} with WSDL: ${wsdl}`, body);
    const debugKey = `${method}`;
    const resp = await this.base.call<T>(wsdl, endpoint, method, body, debugKey);

    const parsedBody = await this.parserResponse(resp);

    // Manejo de errores SOAP Fault
    if ('soap:Fault' in parsedBody) {
      const fault = parsedBody['soap:Fault'];
      this.logger.error(`SOAP Fault received for ${method}:`, fault);
      throw new Error(`SOAP Fault: ${fault.faultstring || 'Unknown error'}`);
    }

    const responseKey = `${method}Response`;
    const resultKey = `${method}Result`;

    const result = parsedBody?.[responseKey]?.[resultKey] ?? parsedBody?.[responseKey]; // fallback si no hay Result explícito

    if (!result) {
      this.logger.error(`No se encontró '${resultKey}' en la respuesta de ${method}`, parsedBody);
      throw new Error(`No '${resultKey}' found in SOAP response`);
    }

    // Manejo de errores de negocio (AFIP)
    if (result.Errors?.Err) {
      const error = result.Errors.Err;
      const code = error.Code ?? 'N/A';
      const msg = error.Msg ?? 'Mensaje no disponible';
      this.logger.error(`Error de AFIP [${code}]: ${msg}`);
      throw new Error(`AFIP Error [${code}]: ${msg}`);
    }

    const hasGetResponse = `ResultGet` in result;

    if (hasGetResponse) {
      return result.ResultGet;
    }

    return result;
  }

  async callLastInvoice(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FECompUltimoAutorizado');
  }

  async callGetIvaTypes(body: string, wsdl: string, endpoint: string): Promise<any> {
    return this.callClient(body, wsdl, endpoint, 'FEParamGetTiposIva');
  }

  async callGetInvoicesTypes(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetTiposCbte');
  }

  async callGetConceptTypes(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetTiposConcepto');
  }
  async callGetDocTypes(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetTiposDoc');
  }

  async callGetCurrencyTypes(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetTiposMonedas');
  }
  async callGetExchangeRate(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetCotizacion');
  }

  async callPuntosDeVenta(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetPtosVenta');
  }

  async callGetCondicionIvaReceptor(body: string, wsdl: string, endpoint: string): Promise<any> {
    return await this.callClient(body, wsdl, endpoint, 'FEParamGetCondicionIvaReceptor');
  }

  parserResponse(response: any): Promise<any> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: 'ar:',
      parseTagValue: true,
      parseAttributeValue: true,
    });
    try {
      this.logger.debug('Parsing XML response', response);
      const jsonResponse = parser.parse(response);
      return jsonResponse['soap:Envelope']['soap:Body'];
    } catch (error) {
      this.logger.error('Error parsing XML response', error);
      throw new Error('Failed to parse XML response');
    }
  }
}
