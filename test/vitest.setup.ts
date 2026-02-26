import 'reflect-metadata';
import { vi } from 'vitest';

declare global {
  var jest: typeof vi;
}

globalThis.jest = vi;
