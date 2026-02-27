import { Roles } from "@/modules/access/interfaces/decorators/role.decorator";
import { IUserRequest } from "@/modules/identity/domain/user.interface";
import { JwtAuthGuard } from "@/modules/identity/interfaces/guards/jwt.guard";
import { Controller, Get, Req, UseGuards, UsePipes } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { AdminService } from "../../application/admin.service";

@UsePipes(ZodValidationPipe)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("users")
  async getUsersAdmin(@Req() req: Request & { user: IUserRequest }) {
    const organizationId = req.user.organization_id;
    const role = req.user.role;
    return this.adminService.getAllUser(role, organizationId);
  }
}
