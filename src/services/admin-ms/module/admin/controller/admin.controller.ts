import { UsePipes, Controller, UseGuards, Get, Req } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Roles } from '../../../../access-ms/modules/role/decorator/role.decorator';
import { JwtAuthGuard } from '../../../../identity-ms/guards/jwt.guard';
import { IUserRequest } from '../../../../identity-ms/modules/user/model/user.interface';
import { AdminService } from '../services/admin.service';

@UsePipes(ZodValidationPipe)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsersAdmin(@Req() req: Request & { user: IUserRequest }) {
    const organizationId = req.user.organization_id;
    const role = req.user.role;
    return this.adminService.getAllUser(role, organizationId);
  }
}
