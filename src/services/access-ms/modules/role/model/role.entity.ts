import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { UserRole } from '../../user-roles/model/user-role.entity';
import { RolePermission } from '../../role-permission/model/role-permission.entity';
import { RoleType } from '@/services/access-ms/modules/role/types/role.type';
import { ScopeType } from '@/services/organization-ms/modules/orgnanization/types/scope.type';
import { Permission } from '../../permission/model/permission.entity';

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

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  permission: Permission[];
}
