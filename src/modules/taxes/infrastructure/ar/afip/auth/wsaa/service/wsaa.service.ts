import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XMLParser } from 'fast-xml-parser';
import { cleanupTmpLink } from '../../../shared/utils';
import type { PkiRepository } from '../../cert/modules/pki/repositories/pki.repository';
import { decryptPem } from '../../cert/modules/pki/utils';
import type { TicketBuilder } from '../builder/ticket.builder';
import type { TicketSigner } from '../signer/ticket.signer';
import type { TokenStore } from '../store/token.store';
import type { WsaaSoapClient } from '../wsaa.client';

@Injectable()
export class WsaaService {
  private readonly logger = new Logger(WsaaService.name);

  private readonly wsdlPath: string;
  private readonly endpointUrl: string;

  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,
    @Inject(TicketBuilder)
    private readonly builder: TicketBuilder,
    @Inject(TicketSigner)
    private readonly signer: TicketSigner,
    @Inject(WsaaSoapClient)
    private readonly client: WsaaSoapClient,
    @Inject(TokenStore)
    private readonly store: TokenStore,
    @Inject(PkiRepository)
    private readonly pkiRepo: PkiRepository,
  ) {
    this.endpointUrl = this.config.getOrThrow<string>('WSAA_LOGIN_URL');
  }

  /**
   * Devuelve un TA válido desde cache o renovado.
   */
  async getAuthorizationTicket(
    service: string,
    tax_id: string,
  ): Promise<{ token: string; sign: string; expirationTime: Date }> {
    const pki = await this.pkiRepo.findByTaxId(tax_id, true);

    const cert = decryptPem(pki.certX509);
    const key = decryptPem(pki.encryptPkPem);
    const passphrase = decryptPem(pki.passphrase);

    this.validatePEM(cert, 'cert');
    this.validatePEM(key, 'key');

    const cached = await this.store.getValid(service, cert, key);
    if (cached) return this.parserResponse(cached);

    const traPath = await this.builder.build(service);

    const tmpId = randomUUID();
    const certPath = path.join(tmpdir(), `afip-cert-${tmpId}.crt`);
    const keyPath = path.join(tmpdir(), `afip-key-${tmpId}.key`);

    await writeFile(certPath, cert);
    await writeFile(keyPath, key);

    try {
      const cms = await this.signer.sign(traPath, certPath, keyPath, passphrase);
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
    if (!content.includes('-----BEGIN') || !content.includes('-----END')) {
      throw new Error(`El archivo ${label} no tiene formato PEM válido`);
    }
  }

  private parserResponse(response) {
    const parser = new XMLParser({ ignoreAttributes: true });
    const root = parser.parse(response);

    const token = root?.loginTicketResponse?.credentials.token;
    const sign = root?.loginTicketResponse?.credentials.sign;

    const expirationTime = root?.loginTicketResponse?.header?.expirationTime;

    if (!token || !sign || !expirationTime) {
      throw new Error('Token o firma inválidos en TA');
    }
    return { token, sign, expirationTime };
  }
}
