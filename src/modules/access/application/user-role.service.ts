import { User } from '@/modules/identity/domain/model/user.entity';
import { Organization } from '@/modules/organization/domain/model/organization.entity';
import type { ScopeType } from '@/modules/organization/domain/types/scope.type';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import type { Role } from '../domain/model/role.entity';
import { UserRole } from '../domain/model/user-role.entity';
import { RoleType } from '../domain/types/role.type';
import { RoleService } from './role.service';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @Inject(RoleService)
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
