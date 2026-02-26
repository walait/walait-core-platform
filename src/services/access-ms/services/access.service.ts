import { Injectable } from '@nestjs/common';
import { RoleService } from '../modules/role/services/role.service';
import { UserRoleService } from '../modules/user-roles/services/user-role.service';
import { User } from '@/services/identity-ms/modules/user/model/user.entity';
import { Membership } from '@/services/organization-ms/modules/membership/model/membership.entity';
import { Organization } from '@/services/organization-ms/modules/orgnanization/model/organization.entity';
import { UserRole } from '../modules/user-roles/model/user-role.entity';
import { EntityManager } from 'typeorm';

@Injectable()
export class AccessService {
  // Add your service methods here
  constructor(
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService,
  ) {}

  async assignInitialRole(
    isGlobalAdmin: boolean,
    user: User,
    membership: Membership,
    organization: Organization,
    manager?: EntityManager,
  ): Promise<UserRole> {
    if (!isGlobalAdmin) {
      let role = (await this.userRoleService.findByUserIdAndRoleId(user.id, membership.role)).role;
      if (!role) {
        role = await this.roleService.getRoleByNameAndScope(membership.role, 'organization');
      }
      return this.userRoleService.createUserRole(
        {
          user_id: user.id,
          role,
          scope: 'organization',
          organization_id: organization.id,
        },
        manager,
      );
    } else {
      const superadminRole = await this.userRoleService.getAdminRole('superadmin');

      return this.userRoleService.createUserRole(
        {
          user_id: user.id,
          role: superadminRole,
          scope: 'global',
          organization_id: organization.id,
        },
        manager,
      );
    }
  }
}
