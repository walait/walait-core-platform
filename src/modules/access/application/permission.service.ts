import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserRole } from '../domain/model/user-role.entity';

// apps/access/services/permission.service.ts
@Injectable()
export class PermissionService {
  constructor(@InjectRepository(UserRole) private urRepo: Repository<UserRole>) {}

  /** Devuelve los nombres de permisos del usuario (set uniq) */
  async listPermissions(userId: string) {
    const rows = await this.urRepo.find({
      where: { user_id: userId },
      relations: ['role', 'role.permissions'],
    });

    const perms = new Set<string>();

    for (const userRole of rows) {
      for (const rolePermission of userRole.role.rolePermissions) {
        perms.add(rolePermission.permission.name);
      }
    }
    return Array.from(perms);
  }

  async hasPermission(userId: string, perm: string) {
    const perms = await this.listPermissions(userId);
    return perms.includes(perm);
  }

  /** Rol superior (jerarquía simple) */
  async hasRoleOrHigher(userId: string, required: 'member' | 'admin' | 'owner' | 'superadmin') {
    const hierarchy = ['member', 'admin', 'owner', 'superadmin'];
    const requiredIdx = hierarchy.indexOf(required);

    const rows = await this.urRepo.find({
      where: { user_id: userId },
      relations: ['role'],
    });

    return rows.some((ur) => hierarchy.indexOf(ur.role.name) >= requiredIdx);
  }
}
