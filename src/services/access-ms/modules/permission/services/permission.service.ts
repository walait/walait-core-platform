import { User } from '@/services/identity-ms/modules/user/model/user.entity';
import { UserRole } from '@/services/access-ms/modules/user-roles/model/user-role.entity';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    rows.forEach((ur) => ur.role.rolePermissions.forEach((p) => perms.add(p.permission.name)));
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
