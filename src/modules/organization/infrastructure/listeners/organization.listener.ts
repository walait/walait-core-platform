import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { OrganizationService } from "../../application/organization.service";

@Controller()
export class OrganizationRmqListener {
  constructor(private readonly orgService: OrganizationService) {}

  @MessagePattern("organizations.getById")
  async handleGetOrganizationById(
    @Payload() { organization_id }: { organization_id: string },
  ) {
    const org = await this.orgService.getOrganizationById(organization_id);
    return org;
  }
}
