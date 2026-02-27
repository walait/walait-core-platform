import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Permission } from "./permission.entity";
import { RolePermission } from "./role-permission.entity";
import { RoleType } from "../types/role.type";
import { ScopeType } from "@/modules/organization/domain/types/scope.type";
import { UserRole } from "./user-role.entity";

@Index("name_scope_index", ["name", "scope"])
@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: RoleType;

  @Column({ default: "organization" })
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
