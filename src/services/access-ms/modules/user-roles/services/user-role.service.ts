import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '../model/user-role.entity';
import { EntityManager, Repository } from 'typeorm';
import { Role } from '../../role/model/role.entity';
import { User } from '@/services/identity-ms/modules/user/model/user.entity';
import { RoleType } from '@/services/access-ms/modules/role/types/role.type';
import { Organization } from '@/services/organization-ms/modules/orgnanization/model/organization.entity';
import { RoleService } from '../../role/services/role.service';
import { ScopeType } from '@/services/organization-ms/modules/orgnanization/types/scope.type';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly roleService: RoleService,
  ) {}

  async findAll() {
    return this.userRoleRepository.find({});
  }
  async createUserRole(
    {
      user_id,
      role,
      scope,
      organization_id,
    }: {
      user_id: string;
      role: Role;
      scope: ScopeType;
      organization_id: string;
    },
    manager?: EntityManager,
  ): Promise<UserRole> {
    const exists = await this.findByUserIdAndRoleId(user_id, role.id);
    if (exists) return exists;

    const repo = manager?.getRepository(UserRole) ?? this.userRoleRepository;
    const userRole = repo.create({
      user_id,
      scope,
      role,
      organization_id,
    });
    return repo.save(userRole);
  }
  async findByUserId(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({ where: { user_id: userId } });
  }
  async findByRoleId(roleId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({ where: { role_id: roleId } });
  }
  async findByUserIdAndRoleId(userId: string, roleId: string): Promise<UserRole | null> {
    return this.userRoleRepository.findOne({
      where: { user_id: userId, role_id: roleId },
    });
  }
  async assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    const userRole = this.userRoleRepository.create({
      user_id: userId,
      role_id: roleId,
    });
    return this.userRoleRepository.save(userRole);
  }
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const userRole = await this.findByUserIdAndRoleId(userId, roleId);
    if (userRole) {
      await this.userRoleRepository.remove(userRole);
    }
  }
  async getAllUserRoles(): Promise<UserRole[]> {
    return this.userRoleRepository.find();
  }
  async getUserRolesByUserId(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({ where: { user_id: userId } });
  }

  async getAdminRole(role: 'superadmin' | 'admin' = 'superadmin') {
    const roleEntity = await this.roleService.getRoleByNameAndScope(role, 'global');
    if (!roleEntity) {
      throw new NotFoundException(`Role ${role} not found`);
    }
    return roleEntity;
  }

  async deleteUserRoleByUserId(userId) {
    return this.userRoleRepository.delete({
      user_id: userId,
    });
  }

  async getUserRoleByUserId(userId) {
    return this.userRoleRepository.find({
      where: { user_id: userId },
    });
  }
}
