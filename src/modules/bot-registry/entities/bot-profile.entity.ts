import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BotHandlerKey } from "../bot-registry.enums";

@Entity("bot_profiles")
export class BotProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  phone_number_id!: string;

  @Column({ type: "enum", enum: BotHandlerKey })
  handler_key!: BotHandlerKey;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
