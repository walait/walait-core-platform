// src/services/email-ms/listeners/permission.rmq.ts
import { Controller, Inject } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  type RmqContext,
} from "@nestjs/microservices";

import { UserRoleService } from "../../application/user-role.service";
import { canAccessOrOwnsResource } from "../../interfaces/policy/permission.policy";

type PermissionMsg = {
  action: string;
  reqUserId: string; // usuario dueño del recurso
  userId: string; // usuario que hace la petición
};

@Controller()
export class PermissionRmqListener {
  constructor(
    @Inject(UserRoleService)
    private readonly userRolesService: UserRoleService,
  ) {}

  /**
   * Devuelve `true | false` según si el requester (userId)
   * puede realizar `action` sobre el recurso de reqUserId.
   */
  @MessagePattern("permission.canAccessResource")
  async handleCanAccessResource(
    @Payload() { action, reqUserId, userId }: PermissionMsg,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      const roles = await this.userRolesService.getUserRoleByUserId(userId);
      const allowed = canAccessOrOwnsResource(roles, action, reqUserId, userId);

      channel.ack(message);
      return allowed; // Nest enviará la respuesta vía RPC
    } catch (err) {
      channel.nack(message, false, false); // descarta (o requeue=true si querés reintentos)
      throw err;
    }
  }
}
