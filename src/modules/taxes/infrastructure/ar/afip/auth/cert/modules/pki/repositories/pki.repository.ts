import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, UpdateResult } from 'typeorm';
import { PublicKeyInfrastructure } from '../entity/pki.entity';

@Injectable()
export class PkiRepository {
  constructor(
    @InjectRepository(PublicKeyInfrastructure)
    private readonly repository: Repository<PublicKeyInfrastructure>,
  ) {}

  /**
   * Devuelve el repositorio de TypeORM por si se necesita acceso directo (query builder, etc).
   */
  getContext(): Repository<PublicKeyInfrastructure> {
    return this.repository;
  }

  /**
   * Busca por CUIT activo (opcionalmente con fallback a inactivos si se requiere).
   */
  async findByTaxId(taxId: string, onlyEnabled = true): Promise<PublicKeyInfrastructure | null> {
    return this.repository.findOne({
      where: { taxId, ...(onlyEnabled ? { enabled: true } : {}) },
    });
  }

  /**
   * Guarda una nueva PKI o actualiza una existente (por ejemplo, tras renovación de certificado).
   */
  async save(pki: Partial<PublicKeyInfrastructure>): Promise<PublicKeyInfrastructure> {
    return this.repository.save(pki);
  }

  async update(pki: Partial<PublicKeyInfrastructure>): Promise<UpdateResult> {
    return await this.repository.update(pki.id, pki);
  }
}
