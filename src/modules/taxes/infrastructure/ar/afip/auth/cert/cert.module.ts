import { CertController } from '@/modules/taxes/interfaces/http/cert.controller';
// src/cert/cert.module.ts
import { Module } from '@nestjs/common';
import { PkiModule } from './modules/pki/pki.module';

@Module({
  imports: [
    PkiModule.register({
      opensslPath: '/opt/homebrew/bin/openssl',
      keySize: 4096,
    }),
  ], // trae PkiService vía PkiModule
  controllers: [CertController], // expone rutas /cert/*
  // No necesitamos providers propios aquí; si quisieras añadir lógica extra
  // podrías crear un CertService y listarlo:
  // providers: [CertService],
  // exports:   [CertService],
})
export class CertModule {}
