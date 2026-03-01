import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ConversationFlowState } from "../tenis.enums";
import { Player } from "./player.entity";

@Entity("tenis_conversation_states")
@Index(["player_id"], { unique: true })
export class ConversationState {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  player_id!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "player_id" })
  player!: Player;

  @Column({ type: "enum", enum: ConversationFlowState })
  state!: ConversationFlowState;

  @Column({ type: "jsonb", nullable: true })
  context!: Record<string, unknown> | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
