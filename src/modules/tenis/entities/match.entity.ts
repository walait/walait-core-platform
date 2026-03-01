import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { MatchStatus, ScheduleSlot } from "../tenis.enums";
import { Challenge } from "./challenge.entity";

@Entity("tenis_matches")
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { unique: true })
  challenge_id!: string;

  @OneToOne(() => Challenge)
  @JoinColumn({ name: "challenge_id" })
  challenge!: Challenge;

  @Column({ type: "enum", enum: MatchStatus })
  status!: MatchStatus;

  @Column("uuid", { nullable: true })
  selected_schedule_option_id!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  scheduled_start_at!: Date | null;

  @Column({ type: "enum", enum: ScheduleSlot, nullable: true })
  scheduled_slot!: ScheduleSlot | null;

  @Column({ type: "date", nullable: true })
  scheduled_date!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
