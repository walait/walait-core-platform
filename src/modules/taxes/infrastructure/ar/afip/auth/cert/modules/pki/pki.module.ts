// src/pki/pki.module.ts
import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicKeyInfrastructure } from './entity/pki.entity';
import { PKI_OPTIONS, type PkiModuleOptions } from './pki.interfaces';
import { PkiRepository } from './repositories/pki.repository';
import { PkiService } from './services/pki.service';

@Module({})
export class PkiModule {
  /** Registro sincrónico: PkiModule.register({ … }) */
  static register(options: PkiModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: PKI_OPTIONS,
      useValue: {
        opensslPath: options.opensslPath ?? 'openssl',
        keySize: options.keySize ?? 2048,
      } satisfies PkiModuleOptions,
    };

    return {
      module: PkiModule,
      imports: [TypeOrmModule.forFeature([PublicKeyInfrastructure])],
      providers: [optionsProvider, PkiService, PkiRepository],
      exports: [PkiService, PkiRepository],
    };
  }

  /** Registro asíncrono: PkiModule.registerAsync({ useFactory, inject }) */
  static registerAsync(asyncOptions: {
    useFactory: (...args: any[]) => Promise<PkiModuleOptions> | PkiModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const defaultImport = [TypeOrmModule.forFeature([PublicKeyInfrastructure])];
    const imports = asyncOptions.inject
      ? [...asyncOptions.inject, ...defaultImport]
      : defaultImport;
    const optionsProvider: Provider = {
      provide: PKI_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: imports,
    };

    return {
      module: PkiModule,
      imports: imports,
      providers: [optionsProvider, PkiService, PkiRepository],
      exports: [PkiService, PkiRepository],
    };
  }
}
