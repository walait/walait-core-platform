// apps/core/entities/membership.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from '../../orgnanization/model/organization.entity';

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
