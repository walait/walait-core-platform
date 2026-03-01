import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ResultReportStatus } from "../tenis.enums";
import { Match } from "./match.entity";
import { Player } from "./player.entity";

@Entity("tenis_result_reports")
export class ResultReport {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { unique: true })
  match_id!: string;

  @OneToOne(() => Match)
  @JoinColumn({ name: "match_id" })
  match!: Match;

  @Column("uuid")
  reported_by_player_id!: string;

  @OneToOne(() => Player)
  @JoinColumn({ name: "reported_by_player_id" })
  reported_by!: Player;

  @Column()
  score_raw!: string;

  @Column({ type: "enum", enum: ResultReportStatus })
  status!: ResultReportStatus;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: "timestamptz", nullable: true })
  confirmed_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  rejected_at!: Date | null;

  @Column("uuid", { nullable: true })
  confirmed_by_player_id!: string | null;
}
