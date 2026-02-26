import { Injectable, Logger } from "@nestjs/common";

import axios from "axios";

@Injectable()
export class WsaaSoapClient {
  private readonly logger = new Logger(WsaaSoapClient.name);

  async callLoginCms(
    cms: string,
    wsdl: string,
    endpoint: string,
  ): Promise<string> {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <loginCms>
      <in0>${cms}</in0>
    </loginCms>
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await axios.post(endpoint, xml, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '""',
        },
        timeout: 30000,
      });

      return response.data as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`WSAA call failed → ${message}`);
      throw err;
    }
  }
}
