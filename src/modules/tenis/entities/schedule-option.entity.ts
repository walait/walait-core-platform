import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ScheduleOptionKind, ScheduleSlot } from "../tenis.enums";
import { ScheduleProposal } from "./schedule-proposal.entity";

@Entity("tenis_schedule_options")
export class ScheduleOption {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  proposal_id!: string;

  @ManyToOne(() => ScheduleProposal)
  @JoinColumn({ name: "proposal_id" })
  proposal!: ScheduleProposal;

  @Column({ type: "enum", enum: ScheduleOptionKind })
  kind!: ScheduleOptionKind;

  @Column({ type: "timestamptz", nullable: true })
  start_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  end_at!: Date | null;

  @Column({ type: "date", nullable: true })
  date!: string | null;

  @Column({ type: "enum", enum: ScheduleSlot, nullable: true })
  slot!: ScheduleSlot | null;

  @Column()
  label!: string;
}
