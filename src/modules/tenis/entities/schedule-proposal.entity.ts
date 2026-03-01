import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ScheduleProposalStatus } from "../tenis.enums";
import { Match } from "./match.entity";
import { Player } from "./player.entity";

@Entity("tenis_schedule_proposals")
export class ScheduleProposal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  match_id!: string;

  @ManyToOne(() => Match)
  @JoinColumn({ name: "match_id" })
  match!: Match;

  @Column("uuid")
  proposed_by_player_id!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "proposed_by_player_id" })
  proposed_by!: Player;

  @Column({ type: "enum", enum: ScheduleProposalStatus })
  status!: ScheduleProposalStatus;

  @CreateDateColumn()
  created_at!: Date;
}
