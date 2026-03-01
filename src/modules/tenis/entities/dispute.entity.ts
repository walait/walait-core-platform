import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { DisputeResolutionType } from "../tenis.enums";
import { Match } from "./match.entity";

@Entity("tenis_disputes")
export class Dispute {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { unique: true })
  match_id!: string;

  @OneToOne(() => Match)
  @JoinColumn({ name: "match_id" })
  match!: Match;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ type: "timestamptz" })
  opened_at!: Date;

  @Column({ type: "timestamptz", nullable: true })
  resolved_at!: Date | null;

  @Column({ nullable: true })
  resolved_by!: string | null;

  @Column({ type: "enum", enum: DisputeResolutionType, nullable: true })
  resolution_type!: DisputeResolutionType | null;
}
