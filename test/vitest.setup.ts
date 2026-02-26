import 'reflect-metadata';
import { vi } from 'vitest';

declare global {
  var jest: typeof vi;
}

process.env.PKI_MASTER_SECRET ??= 'test-pki-secret';

globalThis.jest = vi;
