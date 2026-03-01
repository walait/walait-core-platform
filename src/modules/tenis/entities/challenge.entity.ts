import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ChallengeStatus } from "../tenis.enums";
import { Player } from "./player.entity";

@Entity("tenis_challenges")
export class Challenge {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  challenger_id!: string;

  @Column("uuid")
  challenged_id!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "challenger_id" })
  challenger!: Player;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "challenged_id" })
  challenged!: Player;

  @Column({ type: "enum", enum: ChallengeStatus })
  status!: ChallengeStatus;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "timestamptz" })
  expires_at!: Date;

  @Column({ type: "timestamptz", nullable: true })
  accepted_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  rejected_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  expired_at!: Date | null;

  @Column({ nullable: true })
  challenger_rank_at_create!: number | null;

  @Column({ nullable: true })
  challenged_rank_at_create!: number | null;
}
