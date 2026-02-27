// src/pki/pki.module.ts
import { type DynamicModule, Module, type Provider } from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PublicKeyInfrastructure } from "./entity/pki.entity";
import { PKI_OPTIONS, type PkiModuleOptions } from "./pki.interfaces";
import { PkiRepository } from "./repositories/pki.repository";
import { PkiService } from "./services/pki.service";

@Module({})
export class PkiModule {
  static register(options: PkiModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: PKI_OPTIONS,
      useValue: {
        opensslPath: options.opensslPath ?? "openssl",
        keySize: options.keySize ?? 2048,
      } satisfies PkiModuleOptions,
    };

    return {
      module: PkiModule,
      imports: [TypeOrmModule.forFeature([PublicKeyInfrastructure])],
      providers: [
        optionsProvider,
        PkiService,
        {
          provide: PkiRepository,
          useFactory: (repo: Repository<PublicKeyInfrastructure>) =>
            new PkiRepository(repo),
          inject: [getRepositoryToken(PublicKeyInfrastructure)],
        },
      ],
      exports: [PkiService, PkiRepository],
    };
  }

  /** Registro asíncrono: PkiModule.registerAsync({ useFactory, inject }) */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<PkiModuleOptions> | PkiModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: PkiModule,
      imports: [
        ...(options.imports ?? []),
        TypeOrmModule.forFeature([PublicKeyInfrastructure]),
      ],
      providers: [
        {
          provide: PKI_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        PkiService,
        PkiRepository,
      ],
      exports: [PkiService, PkiRepository],
    };
  }
}
