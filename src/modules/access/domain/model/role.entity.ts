import type { ScopeType } from '@/modules/organization/domain/types/scope.type';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { RoleType } from '../types/role.type';
import type { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

@Index('name_scope_index', ['name', 'scope'])
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: RoleType;

  @Column({ default: 'organization' })
  scope: ScopeType;

  @Column({ nullable: true })
  organization_id: string;

  @OneToMany(
    () => UserRole,
    (ur) => ur.role,
  )
  userRoles: UserRole[];

  @OneToMany(
    () => RolePermission,
    (rp) => rp.role,
  )
  rolePermissions: RolePermission[];

  @OneToMany(
    () => RolePermission,
    (rp) => rp.permission,
  )
  permission: Permission[];
}
