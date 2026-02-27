import * as path from "node:path";

import { Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { PkiRepository } from "../../cert/modules/pki/repositories/pki.repository";
import { TicketBuilder } from "../builder/ticket.builder";
import { TicketSigner } from "../signer/ticket.signer";
import { TokenStore } from "../store/token.store";
import { WsaaSoapClient } from "../wsaa.client";
import { XMLParser } from "fast-xml-parser";
import { cleanupTmpLink } from "../../../shared/utils";
import { decryptPem } from "../../cert/modules/pki/utils";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { writeFile } from "node:fs/promises";

@Injectable()
export class WsaaService {
  private readonly logger = new Logger(WsaaService.name);

  private readonly endpointUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly builder: TicketBuilder,
    private readonly signer: TicketSigner,
    private readonly client: WsaaSoapClient,
    private readonly store: TokenStore,
    private readonly pkiRepo: PkiRepository,
  ) {
    this.endpointUrl = this.config.getOrThrow<string>("WSAA_LOGIN_URL");
  }

  /**
   * Devuelve un TA válido desde cache o renovados.
   */
  async getAuthorizationTicket(
    service: string,
    tax_id: string,
  ): Promise<{ token: string; sign: string; expirationTime: Date }> {
    if (!this.pkiRepo) {
      throw new Error("PkiRepository not configured");
    }

    const pki = await this.pkiRepo.findByTaxId(tax_id, true);
    if (!pki) {
      throw new Error("PKI not found");
    }

    if (!pki.certX509 || !pki.encryptPkPem || !pki.passphrase) {
      throw new Error("PKI data incomplete");
    }

    const cert = decryptPem(pki.certX509);
    const key = decryptPem(pki.encryptPkPem);
    const passphrase = decryptPem(pki.passphrase);

    this.validatePEM(cert, "cert");
    this.validatePEM(key, "key");

    const cached = await this.store.getValid(service, cert, key);
    if (cached) return this.parserResponse(cached);

    const traPath = await this.builder.build(service);

    const tmpId = randomUUID();
    const certPath = path.join(tmpdir(), `afip-cert-${tmpId}.crt`);
    const keyPath = path.join(tmpdir(), `afip-key-${tmpId}.key`);

    await writeFile(certPath, cert);
    await writeFile(keyPath, key);

    try {
      const cms = await this.signer.sign(
        traPath,
        certPath,
        keyPath,
        passphrase,
      );
      const taXml = await this.client.callLoginCms(
        cms,
        `${this.endpointUrl}?WSDL`,
        this.endpointUrl,
      );
      await this.store.save(service, cert, key, taXml);
      return this.parserResponse(taXml);
    } finally {
      await Promise.allSettled([
        cleanupTmpLink(certPath),
        cleanupTmpLink(keyPath),
        cleanupTmpLink(traPath),
      ]);
    }
  }

  private validatePEM(content: string, label: string): void {
    if (!content.includes("-----BEGIN") || !content.includes("-----END")) {
      throw new Error(`El archivo ${label} no tiene formato PEM válido`);
    }
  }

  private parserResponse(response: string) {
    const parser = new XMLParser({ ignoreAttributes: true });
    const root = parser.parse(response);

    const token = root?.loginTicketResponse?.credentials.token;
    const sign = root?.loginTicketResponse?.credentials.sign;

    const expirationTime = root?.loginTicketResponse?.header?.expirationTime;

    if (!token || !sign || !expirationTime) {
      throw new Error("Token o firma inválidos en TA");
    }
    return { token, sign, expirationTime };
  }
}
