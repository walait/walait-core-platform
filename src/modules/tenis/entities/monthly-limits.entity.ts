import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Player } from "./player.entity";

@Entity("tenis_monthly_limits")
@Index(["player_id", "yyyymm"], { unique: true })
export class MonthlyLimits {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  player_id!: string;

  @ManyToOne(() => Player)
  @JoinColumn({ name: "player_id" })
  player!: Player;

  @Column()
  yyyymm!: number;

  @Column({ default: 0 })
  sent_count!: number;

  @Column({ default: 0 })
  accepted_count!: number;
}
