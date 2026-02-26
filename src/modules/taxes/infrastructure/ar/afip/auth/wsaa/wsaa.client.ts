import { Injectable, Logger } from '@nestjs/common';

import type { BaseSoapClient } from '../../shared/services/baseSoapClient.service';

@Injectable()
export class WsaaSoapClient {
  private readonly logger = new Logger(WsaaSoapClient.name);
  constructor(private readonly base: BaseSoapClient) {}
  /**
   * Invoca loginCms pasando el CMS firmado y devuelve el TA (XML)
   */
  async callLoginCms(cms: string, wsdl: string, endpoint: string): Promise<string> {
    const resp = await this.base.call<{ loginCmsReturn: string }>(
      wsdl,
      endpoint,
      'loginCms',
      { in0: cms },
      'loginCms',
    );
    return resp.loginCmsReturn;
  }
}
