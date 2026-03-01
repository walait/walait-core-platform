import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tenis_players")
export class Player {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  phone_e164!: string;

  @Column()
  display_name!: string;

  @Column({ nullable: true })
  display_name_normalized!: string | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
