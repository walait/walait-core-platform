// src/pki/pki.interfaces.ts
export interface PkiModuleOptions {
  opensslPath?: string; // por defecto 'openssl' en PATH
  keySize?: number; // por defecto 2048
}

export const PKI_OPTIONS = Symbol('PKI_OPTIONS');
