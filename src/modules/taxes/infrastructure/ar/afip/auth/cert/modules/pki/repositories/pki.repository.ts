import { Repository, UpdateResult } from "typeorm";

import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { PublicKeyInfrastructure } from "../entity/pki.entity";

@Injectable()
export class PkiRepository {
  constructor(
    private readonly repository: Repository<PublicKeyInfrastructure>,
  ) {}

  getContext(): Repository<PublicKeyInfrastructure> {
    return this.repository;
  }

  async findByTaxId(
    taxId: string,
    onlyEnabled = true,
  ): Promise<PublicKeyInfrastructure | null> {
    return this.repository.findOne({
      where: { taxId, ...(onlyEnabled ? { enabled: true } : {}) },
    });
  }

  async save(
    pki: Partial<PublicKeyInfrastructure>,
  ): Promise<PublicKeyInfrastructure> {
    return this.repository.save(pki);
  }

  async update(pki: Partial<PublicKeyInfrastructure>): Promise<UpdateResult> {
    const id = pki.id;
    if (!id) {
      throw new Error("PKI id is required for update");
    }
    return this.repository.update(id, pki);
  }
}
