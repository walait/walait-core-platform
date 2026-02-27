import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Logger,
  Post,
} from "@nestjs/common";
import { XMLParser } from "fast-xml-parser";
import { WsaaService } from "../../infrastructure/ar/afip/auth/wsaa/service/wsaa.service";
import { FacturacionService } from "../../infrastructure/ar/afip/wsfev1/services/facturacion.service";
import { Wsfev1Service } from "../../infrastructure/ar/afip/wsfev1/services/wsfev1.service";

@Injectable()
@Controller("wsfev1")
export class Wsfev1Controller {
  private readonly logger = new Logger(Wsfev1Controller.name);
  constructor(
    private readonly wsfev1Service: Wsfev1Service,
    private readonly wsaaService: WsaaService,
    private readonly facturacionService: FacturacionService,
  ) {}

  @Post("iva-types")
  async getIvaTypes(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );

    const response = await this.handleResponsePromise(
      this.wsfev1Service.getIvaTypes({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );

    return response;
  }

  @Post("invoice-types")
  async getInvoiceTypes(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );

    const response = await this.handleResponsePromise(
      this.wsfev1Service.getInvoiceTypes({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );

    return response;
  }

  @Post("concept-types")
  async getConceptTypes(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );

    const response = await this.handleResponsePromise(
      this.wsfev1Service.getConceptTypes({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );

    return response;
  }

  @Post("doc-types")
  async getDocTypes(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getDocTypes({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );
    return response;
  }

  @Post("currency-types")
  async getCurrencyTypes(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getCurrencyTypes({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );
    return response;
  }

  @Post("last-invoice")
  async getLastInvoice(
    @Body() body: { tax_id: string; salesPoint: number; receiptType: number },
  ) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getLastInvoice({
        token,
        sign,
        cuit: body.tax_id,
        ptoVta: body.salesPoint,
        cbteTipo: body.receiptType,
      }),
    );
    return response;
  }

  @Post("invoice")
  async submitInvoice(@Body() body: { invoice: any }) {
    const invoice = body.invoice;

    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      invoice.seller.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.facturacionService.submitElectronicInvoiceForCAEApproval(invoice, {
        token,
        sign,
        cuit: invoice.seller.tax_id,
      }),
    );
    return response;
  }

  @Post("sales-point")
  async getSalesPoint(@Body() body: { tax_id: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getSalesPoint({
        token,
        sign,
        cuit: body.tax_id,
      }),
    );
    return response;
  }

  @Post("exchange-rate")
  async getExchangeRate(@Body() body: { tax_id: string; currencyId: string }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getExchangeRate(
        {
          token,
          sign,
          cuit: body.tax_id,
        },
        body.currencyId,
      ),
    );
    return response;
  }

  @Post("get-iva-receptor")
  async getIvaReceptor(@Body() body: { tax_id: string; receiptType: number }) {
    const { token, sign } = await this.wsaaService.getAuthorizationTicket(
      "wsfe",
      body.tax_id,
    );
    const response = await this.handleResponsePromise(
      this.wsfev1Service.getCondicionIvaReceptor({
        token,
        sign,
        cuit: body.tax_id,
        cbteTipo: body.receiptType,
      }),
    );
    return response;
  }

  parserXMLResponse<T = any>(response: string | Buffer): T {
    const parser = new XMLParser();
    return parser.parse(response.toString());
  }

  handleResponsePromise<T>(promise: Promise<T>): Promise<T> {
    return promise.catch((error) => {
      throw new BadRequestException(error.message);
    });
  }
}
