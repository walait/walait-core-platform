import { PermissionService } from '@/services/access-ms/modules/permission/services/permission.service';
import { IUserRequest } from '@/services/identity-ms/modules/user/model/user.interface';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorator/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest<{ user: IUserRequest }>();
    const user = request.user;

    if (!user?.sub) throw new UnauthorizedException();

    const userPermissions = await this.permissionService.listPermissions(user.sub);

    const hasAllPermissions = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
