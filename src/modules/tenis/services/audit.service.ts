import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "../entities/audit-log.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    entityType: string,
    entityId: string,
    action: string,
    actorPhone: string | null,
    payload: Record<string, unknown> | null,
  ): Promise<void> {
    const entry = this.auditRepository.create({
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_phone: actorPhone,
      payload_json: payload,
    });
    await this.auditRepository.save(entry);
  }
}
