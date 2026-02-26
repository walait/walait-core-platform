import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { UserRoleService } from '../modules/user-roles/services/user-role.service';
import { RoleService } from '../modules/role/services/role.service';
import { RoleType } from '../modules/role/types/role.type';
import { ScopeType } from '@/services/organization-ms/modules/orgnanization/types/scope.type';
import { EntityManager } from 'typeorm';

type UserRoleByUserIdEvent = {
  user_id: string;
};

type CreateInitialRole = {
  isGlobalAdmin: boolean;
  user_id: string;
  role_name: string;
  scope: ScopeType;
  organization_id: string;
};

@Controller()
export class UserRolesRmqListener {
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService,
  ) {}

  @MessagePattern('user-roles.deleteUserRole')
  async handleUserRoleDeleteByUserId(@Payload() event: UserRoleByUserIdEvent) {
    await this.userRoleService.deleteUserRoleByUserId(event.user_id);
  }

  @MessagePattern('user-roles.getUserRoleById')
  async handleGetUserRolesById(@Payload() event: UserRoleByUserIdEvent) {
    const result = await this.userRoleService.getUserRoleByUserId(event.user_id);
    return result;
  }

  @MessagePattern('user-roles.getAll')
  async handleGetAllUserRoles() {
    const result = await this.userRoleService.findAll();
    return result;
  }

  @MessagePattern('user-roles.createUserRole')
  async handleAssignInitialRole(@Payload() event: CreateInitialRole) {
    const { user_id, isGlobalAdmin, role_name, organization_id } = event;

    const role = await this.roleService.getRoleByNameAndScope(
      role_name as RoleType,
      isGlobalAdmin ? 'global' : 'organization',
    );

    const result = await this.userRoleService.createUserRole({
      user_id,
      organization_id,
      role,
      scope: role.scope,
    });

    return result;
  }
}
