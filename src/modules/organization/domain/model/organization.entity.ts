// apps/core/entities/organization.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Membership } from './membership.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(
    () => Membership,
    (m) => m.organization,
  )
  memberships: Membership[];

  @Column({ nullable: true })
  domain?: string;

  @CreateDateColumn()
  created_at: Date;
}
