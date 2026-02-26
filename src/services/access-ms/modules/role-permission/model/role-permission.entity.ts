import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { Role } from '../../role/model/role.entity';
import { Permission } from '../../permission/model/permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @RelationId((rp: RolePermission) => rp.role)
  role_id: string;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @RelationId((rp: RolePermission) => rp.permission)
  permission_id: string;
}
