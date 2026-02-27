import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { Membership } from "@/modules/organization/domain/model/membership.entity";
import { Organization } from "@/modules/organization/domain/model/organization.entity";
import { RoleService } from "./role.service";
import { User } from "@/modules/identity/domain/model/user.entity";
import { UserRole } from "../domain/model/user-role.entity";
import { UserRoleService } from "./user-role.service";

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
      let role = (
        await this.userRoleService.findByUserIdAndRoleId(
          user.id,
          membership.role,
        )
      ).role;
      if (!role) {
        role = await this.roleService.getRoleByNameAndScope(
          membership.role,
          "organization",
        );
      }
      return this.userRoleService.createUserRole(
        {
          user_id: user.id,
          role,
          scope: "organization",
          organization_id: organization.id,
        },
        manager,
      );
    }

    const superadminRole =
      await this.userRoleService.getAdminRole("superadmin");

    return this.userRoleService.createUserRole(
      {
        user_id: user.id,
        role: superadminRole,
        scope: "global",
        organization_id: organization.id,
      },
      manager,
    );
  }
}
