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
import { Player } from "./player.entity";

@Entity("tenis_player_aliases")
@Index(["player_id", "alias_normalized"], { unique: true })
@Index(["alias_normalized"])
export class PlayerAlias {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  player_id!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "player_id" })
  player!: Player;

  @Column()
  alias!: string;

  @Column()
  alias_normalized!: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
