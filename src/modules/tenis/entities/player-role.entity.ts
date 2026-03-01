import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { PlayerRoleType } from "../tenis.enums";

@Entity("tenis_player_roles")
export class PlayerRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  phone_e164!: string;

  @Column({ type: "enum", enum: PlayerRoleType })
  role!: PlayerRoleType;

  @Column({ default: true })
  is_active!: boolean;
}
