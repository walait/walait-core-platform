import { RoleType } from '@/services/access-ms/modules/role/types/role.type';
import { ScopeType } from '@/services/organization-ms/modules/orgnanization/types/scope.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../model/role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private roleRepository: Repository<Role>) {}

  async createRole(name: RoleType, scope: ScopeType, organization_id: string): Promise<Role> {
    const role = this.roleRepository.create({
      name,
      scope,
      organization_id,
    });
    return this.roleRepository.save(role);
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  async getRoleByNameAndScope(name: RoleType, scope: ScopeType): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, scope },
    });
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }
  async updateRole(
    id: string,
    name: RoleType,
    scope: ScopeType,
    organization_id: string,
  ): Promise<Role> {
    const role = await this.getRoleById(id);
    role.name = name;
    role.scope = scope;
    role.organization_id = organization_id;
    return this.roleRepository.save(role);
  }
}
