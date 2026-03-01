import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("tenis_inbound_messages")
export class InboundMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  wa_message_id!: string;

  @Column({ nullable: true })
  from_wa_id!: string | null;

  @Column({ nullable: true })
  phone_number_id!: string | null;

  @Column({ nullable: true })
  message_type!: string | null;

  @Column({ type: "jsonb", nullable: true })
  payload_json!: Record<string, unknown> | null;

  @CreateDateColumn()
  received_at!: Date;
}
