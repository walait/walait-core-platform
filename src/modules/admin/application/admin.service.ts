import { RoleHierarchy } from "@/modules/access/domain/constants/role-hierarchy.constant";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AdminService {
  constructor(@Inject("EVENT_BUS") private client: ClientProxy) {}

  private async getUserByUserRole(userIds: string[]) {
    return firstValueFrom(
      this.client.send("user.getAllByUserRoleId", {
        userIds,
      }),
    );
  }

  private async getUserRoles() {
    return firstValueFrom(this.client.send("user-role.getAll", {}));
  }

  private async getOrganizationById(id: string) {
    return firstValueFrom(this.client.send("organization.getById", { id }));
  }

  async getAllUser(reqUserRole: string, reqOrganizationId: string) {
    const [userRoles] = await this.getUserRoles();
    const userIds: string[] = userRoles.map((userRole) => userRole.user_id);
    const [users] = await this.getUserByUserRole(userIds);

    const userRoleMap = new Map<string, any[]>();

    for (const ur of userRoles) {
      if (!userRoleMap.has(ur.user_id)) {
        userRoleMap.set(ur.user_id, []);
      }
      userRoleMap.get(ur.user_id).push(ur);
    }

    const mapped: { roleName: string; organization_id: string }[] = [];
    for (const user of users) {
      const userRolesByUser = userRoleMap.get(user.id);
      const currentHierarchy = RoleHierarchy[reqUserRole];
      const userRole = userRolesByUser.find(
        (role) => role.organization_id === reqOrganizationId,
      );

      const [organization] = await this.getOrganizationById(reqOrganizationId);

      const base = {
        organization_id: organization.id,
        organizationName: organization.name,
      };

      if (currentHierarchy === 4) {
        const anyRole = userRole ?? userRoles[0];
        mapped.push({
          ...user,
          ...base,
          roleName: anyRole?.role?.name,
        });

        mapped.push({
          ...user,
          ...base,
          roleName: userRole.role?.name,
        });
      }
    }

    return mapped.filter((user) => {
      if (!user) return false;

      const currentHierarchy = RoleHierarchy[reqUserRole];
      const userHierarchy = RoleHierarchy[user.roleName];

      if (currentHierarchy === 4) {
        return true;
      }

      return (
        currentHierarchy >= userHierarchy &&
        user.organization_id === reqOrganizationId
      );
    });
  }
}
