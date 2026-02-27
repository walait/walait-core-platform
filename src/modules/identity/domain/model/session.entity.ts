// src/sessions/session.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  refresh_token?: string;

  @Column({ nullable: true })
  session_secret?: string;

  @Column({ nullable: true })
  user_agent?: string;

  @Column({ nullable: true })
  ip_address?: string;

  @Column({ type: 'timestamp' })
  expires_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
