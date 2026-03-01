import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Player } from "./player.entity";

@Entity("tenis_player_stats")
export class PlayerStats {
  @PrimaryColumn("uuid")
  player_id!: string;

  @OneToOne(() => Player)
  @JoinColumn({ name: "player_id" })
  player!: Player;

  @Column({ default: 0 })
  points!: number;

  @Column({ nullable: true })
  rank_position!: number | null;

  @Column({ type: "timestamptz", nullable: true })
  last_rank_recalc_at!: Date | null;
}
