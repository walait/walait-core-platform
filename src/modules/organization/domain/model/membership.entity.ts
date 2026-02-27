// apps/core/entities/membership.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('organization_memberships')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ default: 'member' })
  role: 'owner' | 'admin' | 'member' | 'superadmin';

  @Column({ default: 'accepted' })
  status: 'pending' | 'invited' | 'accepted';

  @CreateDateColumn()
  joined_at: Date;
}
