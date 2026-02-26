import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';

import { JwtAuthGuard } from '@/services/identity-ms/guards/jwt.guard';
import { UserService } from '../services/user.service';
import { PermissionService } from '@/services/access-ms/modules/permission/services/permission.service';
import { SignUpInput } from '../../auth/schemas/auth.schema';
import { UserRoleService } from '@/services/access-ms/modules/user-roles/services/user-role.service';
import { IUserRequest } from '../model/user.interface';
import { Request } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@UsePipes(ZodValidationPipe)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject('EVENT_BUS') private client: ClientProxy,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req) {
    return req.user;
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateData: SignUpInput) {
    const userId = req.user.sub;
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (updateData.email && updateData.email !== user.email) {
      throw new ConflictException('Email cannot be changed');
    }

    if (updateData.first_name) {
      user.first_name = updateData.first_name;
    }

    if (updateData.last_name) {
      user.last_name = updateData.last_name;
    }

    if (updateData.password && updateData.password !== user.password_hash) {
      throw new ConflictException('Password cannot be changed via this endpoint');
    }

    if (updateData.avatar_url) {
      user.avatar_url = updateData.avatar_url;
    }
    if (updateData.metadata) {
      user.metadata = updateData.metadata;
    }
    const updateUser = await this.userService.updateUser(user);

    return {
      message: 'Profile updated successfully',
      user: this.userService.toResponse(updateUser),
    };
  }

  @Delete('me/:userId')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(
    @Req() req: Request & { user: IUserRequest },
    @Param('userId') reqUserId: string,
  ) {
    const user = await this.userService.findById(reqUserId, true); // populate relations
    if (!user) throw new NotFoundException('User not found');

    const canProcess = await firstValueFrom(
      this.client.send('permission.canAccessResource', {
        action: 'delete:profile',
        reqUserId,
        userId: req.user.sub,
      }),
    );

    if (!canProcess) {
      throw new ForbiddenException("You can't process this action", {});
    }

    await firstValueFrom(this.client.send('user-roles.deleteUserRole', { user_id: reqUserId }));
    await firstValueFrom(
      this.client.send('session.deleteByUser', {
        user_id: reqUserId,
      }),
    );
    await this.userService.deleteUser(reqUserId);

    return {
      message: 'Profile deleted successfully',
      user: this.userService.toResponse(user),
    };
  }
}
