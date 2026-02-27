import { exec } from "node:child_process";
import { promisify } from "node:util";
// src/pki/pki.service.ts
import { Inject, Injectable, Logger } from "@nestjs/common";
import { PKI_OPTIONS, type PkiModuleOptions } from "../pki.interfaces";
import { PkiRepository } from "../repositories/pki.repository";
import { encryptPem, generateStrongPassphrase } from "../utils";

const execAsync = promisify(exec);

@Injectable()
export class PkiService {
  private readonly logger = new Logger(PkiService.name);

  constructor(
    @Inject(PKI_OPTIONS) private readonly opts: PkiModuleOptions,
    private readonly pkiRepository: PkiRepository,
  ) {}

  /* ────────────────────────────────────────────────────────────────
   * 1) KEY + CSR
   * ──────────────────────────────────────────────────────────────── */
  async generateKeyAndCsr(dto: {
    subj_o: string;
    subj_cn: string;
    subj_cuit: string;
  }): Promise<{ csrPem: string }> {
    const { opensslPath, keySize } = this.opts;

    // 1. Generar clave privada
    const { stdout: privateKeyPem } = await execAsync(
      `${opensslPath} genrsa ${keySize}`,
    );

    // 2. Construir Subject correcto para AFIP
    // Evitar caracteres especiales o espacios no codificados
    const subj = `/C=AR/O=${dto.subj_o}/CN=${dto.subj_cn}/serialNumber=CUIT ${dto.subj_cuit}`;

    // 3. Generar CSR con -sha256 (requerido por AFIP)
    const csrPem = await this.createCsrWithTempKey(
      privateKeyPem,
      subj,
      `${opensslPath}`,
    );

    const pki = this.pkiRepository.getContext().create({
      taxId: dto.subj_cuit,
      encryptPkPem: encryptPem(privateKeyPem),
      certificateSigningRequest: encryptPem(csrPem),
      passphrase: encryptPem(generateStrongPassphrase()),
    });

    await this.pkiRepository.save(pki);

    return { csrPem };
  }

  /* ────────────────────────────────────────────────────────────────
   * 2) PFX / PKCS#12
   * ──────────────────────────────────────────────────────────────── */
  /**
   * Genera un contenedor PKCS#12 en memoria a partir de la clave privada
   * y su certificado. Devuelve un Buffer con el contenido binario del .pfx.
   */
  async saveCertX50(
    tax_id: string,
    certData: {
      cert: string;
      cert_expiration: Date | string;
    },
  ): Promise<any> {
    this.logger.debug(certData.cert.split("\n").slice(0, 3).join("\n"));

    const pki = await this.pkiRepository.findByTaxId(tax_id, true);

    if (!pki || !pki.enabled) {
      throw new Error("");
    }
    pki.certX509 = encryptPem(certData.cert);
    pki.certX509Expiration = new Date(certData.cert_expiration);

    await this.pkiRepository.update(pki);

    // const { opensslPath } = this.opts;
    // const fs = await import('fs/promises');
    // const path = await import('path');
    // const os = await import('os');

    // const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pki-'));
    // const keyPath = path.join(tmpDir, 'key.pem');
    // const crtPath = path.join(tmpDir, 'crt.pem');
    // const pfxPath = path.join(tmpDir, 'bundle.pfx');

    // const privateKeyPem = decryptPem(pki.encryptPkPem);
    // const passphrase = decryptPem(pki.passphrase);

    // await fs.writeFile(keyPath, privateKeyPem);
    // await fs.writeFile(crtPath, certPem);

    // const cmd =
    //   `${opensslPath} pkcs12 -export -inkey "${keyPath}" -in "${crtPath}" ` +
    //   `-out "${pfxPath}" -passout pass:${passphrase}`;

    // try {
    //   const { stderr } = await execAsync(cmd, { maxBuffer: 1024 * 500 });
    //   if (stderr) this.logger.error(`OpenSSL stderr: ${stderr.trim()}`);

    //   if (!(await fs.stat(pfxPath).catch(() => null)))
    //     throw new Error('OpenSSL did not output the .pfx file');

    //   return await fs.readFile(pfxPath);
    // } finally {
    //   // Limpieza forzada, ignora ENOENT
    //   await Promise.allSettled(
    //     [keyPath, crtPath, pfxPath].map((f) => fs.rm(f, { force: true }).catch(() => null)),
    //   );
    //   await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => null);
    // }
  }

  /* ────────────────────────────────────────────────────────────────
   * PRIVATE HELPERS
   * ──────────────────────────────────────────────────────────────── */
  private async createCsrWithTempKey(
    privateKeyPem: string,
    subj: string,
    opensslPath: string,
  ): Promise<string> {
    const fs = await import("fs");
    const os = await import("os");
    const path = await import("path");

    const keyPath = path.join(os.tmpdir(), `key-${Date.now()}.pem`);
    fs.writeFileSync(keyPath, privateKeyPem);

    try {
      const { stdout } = await execAsync(
        `${opensslPath} req -new -sha256 -key "${keyPath}" -subj "${subj}"`,
        { maxBuffer: 1024 * 500 },
      );
      return stdout;
    } finally {
      fs.unlinkSync(keyPath);
    }
  }
}
