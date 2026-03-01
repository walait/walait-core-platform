import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("tenis_audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  entity_type!: string;

  @Column()
  entity_id!: string;

  @Column()
  action!: string;

  @Column({ nullable: true })
  actor_phone!: string | null;

  @Column({ type: "jsonb", nullable: true })
  payload_json!: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at!: Date;
}
