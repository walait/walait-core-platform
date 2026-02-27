import { randomUUID } from 'crypto';
import * as path from 'node:path';
import { tmpdir } from 'os';
import { Injectable } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { create } from 'xmlbuilder2';

@Injectable()
export class TicketBuilder {
  /**
   * Genera el archivo TRA para el servicio indicado.
   * @param service - Servicio AFIP (ej: "wsfe")
   * @returns Ruta absoluta al archivo generado
   */
  async build(service: string): Promise<string> {
    const now = Date.now();

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('loginTicketRequest', { version: '1.0' })
      .ele('header')
      .ele('uniqueId')
      .txt(Math.floor(now / 1000).toString())
      .up()
      .ele('generationTime')
      .txt(new Date(now - 60000).toISOString())
      .up()
      .ele('expirationTime')
      .txt(new Date(now + 60000).toISOString())
      .up()
      .up()
      .ele('service')
      .txt(service)
      .end({ prettyPrint: false });

    const outputPath = path.join(tmpdir(), `TRA-${randomUUID()}.xml`);
    await writeFile(outputPath, xml);

    return outputPath;
  }
}
