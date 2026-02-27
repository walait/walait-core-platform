import {
  AuthData,
  FacturacionBuilder,
  InvoiceRequest,
} from "../builder/facturacion.builder";
import { Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { Wsfev1Client } from "../wsfev1.client";
import { readFile } from "fs/promises";

@Injectable()
export class Wsfev1Service {
  private readonly logger = new Logger(Wsfev1Service.name);

  private readonly wsdlPath?: string;
  private readonly endpointUrl: string;
  private readonly wsdl: string;

  constructor(
    private readonly config: ConfigService,
    // private readonly builder: TicketBuilder,
    private readonly wsfev1Client: Wsfev1Client,
    private readonly builder: FacturacionBuilder,
  ) {
    this.endpointUrl = `${this.config.getOrThrow<string>("WSFEV1_URL")}`;
    this.wsdl = `${this.endpointUrl}?WSDL`;
  }

  async submitElectronicInvoiceForCAEApproval(input: InvoiceRequest) {
    const { path, cleanup } = await this.builder.buildFECAESolicitarFile(input);
    const body = await readFile(path, "utf8");
    await cleanup();
    return await this.wsfev1Client.callFeCAE(body, this.wsdl, this.endpointUrl);
  }

  async getLastInvoice(
    params: AuthData & { ptoVta: number; cbteTipo: number },
  ) {
    const { path, cleanup } =
      await this.builder.buildGetUltimoComprobante(params);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callLastInvoice(body, this.wsdl, this.endpointUrl);
  }

  async getIvaTypes(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildTiposIva(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetIvaTypes(body, this.wsdl, this.endpointUrl);
  }

  async getInvoiceTypes(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildTiposComprobates(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetInvoicesTypes(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }

  async getConceptTypes(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildGetTiposConcepto(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetInvoicesTypes(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }

  async getDocTypes(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildGetTiposDocumentos(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetDocTypes(body, this.wsdl, this.endpointUrl);
  }

  async getCurrencyTypes(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildGetTiposMonedas(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetCurrencyTypes(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }

  async getExchangeRate(auth: AuthData, moendaId: string) {
    const { path, cleanup } = await this.builder.buildGetCotizacion(
      auth,
      moendaId,
    );
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetExchangeRate(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }

  async getSalesPoint(auth: AuthData) {
    const { path, cleanup } = await this.builder.buildPuntosVenta(auth);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callPuntosDeVenta(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }

  async getCondicionIvaReceptor(params: AuthData & { cbteTipo: number }) {
    const { path, cleanup } =
      await this.builder.buildGetCondicionIvaReceptor(params);
    const body = await readFile(path, "utf8");
    await cleanup();
    return this.wsfev1Client.callGetCondicionIvaReceptor(
      body,
      this.wsdl,
      this.endpointUrl,
    );
  }
}
