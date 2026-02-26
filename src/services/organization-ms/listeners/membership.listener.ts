import type { RoleType } from '@/modules/access/domain/types/role.type';
// src/services/organization-ms/listeners/membership.rmq.ts
import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import type { MemberService } from '../modules/membership/services/member.service';
import type { Organization } from '../modules/orgnanization/model/organization.entity';

type CreateMembership = {
  user_id: string;
  organization: Organization;
  role: RoleType;
};

@Controller()
export class MembershipRmqListener {
  constructor(private readonly memberService: MemberService) {}

  @MessagePattern('membership.createMembership')
  async handleCreateMembership(@Payload() event: CreateMembership) {
    const result = await this.memberService.createMembership(event);

    return result;
  }
}
