// apps/auth/entities/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from '../../role-permission/model/role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g., 'read:project'

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => RolePermission, (rp) => rp)
  rolePermissions: RolePermission[];
}
