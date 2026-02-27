import { execFileSync } from 'child_process';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { readFile, unlink } from 'fs/promises';

@Injectable()
export class TicketSigner {
  private readonly logger = new Logger(TicketSigner.name);

  /**
   * Firma digitalmente el archivo TRA y devuelve el CMS en Base64
   * @param traPath - Ruta al archivo TRA.xml generado
   * @param certPath - Ruta al archivo .crt
   * @param keyPath - Ruta al archivo .key
   * @param passphrase - Passphrase del archivo .key (si existe)
   */

  async sign(traPath: string, certPath: string, keyPath: string, passphrase = ''): Promise<string> {
    const tmpPath = path.resolve('TRA.tmp');

    this.logger.debug('Firmando TRA con openssl cms -sign');

    execFileSync('openssl', [
      'cms', // ←  cambia pkcs7 → cms
      '-sign',
      '-in',
      traPath,
      '-out',
      tmpPath,
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      ...(passphrase ? ['-passin', `pass:${passphrase}`] : []),
      '-outform',
      'PEM',
      '-nodetach',
      '-binary', //  opcional, evita conversión CRLF
    ]);

    /* Extraer sólo el bloque base64 */
    const pem = await readFile(tmpPath, 'utf8');
    await unlink(tmpPath);

    return pem
      .split('\n')
      .filter((l) => !l.startsWith('-----'))
      .join('');
  }
}
