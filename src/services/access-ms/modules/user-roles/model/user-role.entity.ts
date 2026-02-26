import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  RelationId,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RolePermission } from '../../role-permission/model/role-permission.entity';
import { Role } from '../../role/model/role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() user_id: string; // ← viene de identity-ms

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' }) // esto crea y mapea la columna role_id
  role: Role;

  @RelationId((ur: UserRole) => ur.role) // ahora sí usa la misma entidad
  role_id: string;

  @Column() organization_id: string; // ← viene de organization-ms
  @Column({ default: 'organization' })
  scope: 'global' | 'organization' | 'app';

  @Column({ type: 'timestamptz', default: () => 'now()' })
  granted_at: Date;
}
