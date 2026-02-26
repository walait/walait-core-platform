import { Injectable, Logger } from "@nestjs/common";

import { XMLParser } from "fast-xml-parser";
import axios from "axios";

@Injectable()
export class Wsfev1Client {
  private readonly logger = new Logger(Wsfev1Client.name);

  async callFeCAE(body: string, wsdl: string, endpoint: string): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FECAESolicitar");
  }

  async callClient(
    body: string,
    wsdl: string,
    endpoint: string,
    method: string,
  ): Promise<any> {
    this.logger.debug(`Calling ${method} on ${endpoint}`);

    const soapAction = `http://ar.gov.afip.dif.FEV1/${method}`;

    try {
      const response = await axios.post(endpoint, body, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: soapAction,
        },
        timeout: 30000,
      });

      return this.parseResponse(response.data as string);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`WSFEV1 call failed [${method}] → ${message}`);
      throw err;
    }
  }

  async callLastInvoice(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FECompUltimoAutorizado");
  }

  async callGetIvaTypes(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetTiposIva");
  }

  async callGetInvoicesTypes(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetTiposCbte");
  }

  async callGetConceptTypes(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetTiposConcepto");
  }

  async callGetCurrencyTypes(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetTiposMonedas");
  }

  async callGetDocTypes(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetTiposDoc");
  }

  async callGetExchangeRate(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetCotizacion");
  }

  async callPuntosDeVenta(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(body, wsdl, endpoint, "FEParamGetPtosVenta");
  }

  async callGetCondicionIvaReceptor(
    body: string,
    wsdl: string,
    endpoint: string,
  ): Promise<any> {
    return this.callClient(
      body,
      wsdl,
      endpoint,
      "FEParamGetCondicionIvaReceptor",
    );
  }

  parseResponse(response: string): any {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
    });

    try {
      const json = parser.parse(response);
      return json["soap:Envelope"]?.["soap:Body"];
    } catch (error) {
      this.logger.error("Error parsing XML response", error);
      throw new Error("Failed to parse XML response");
    }
  }
}
