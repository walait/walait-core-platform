import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserRequest } from '@/services/identity-ms/modules/user/model/user.interface';
import { RoleType } from '@/services/access-ms/modules/role/types/role.type';
import { RoleHierarchy } from '@/services/access-ms/modules/role/constants/role-hierarchy.constant';
import { ROLES_KEY } from '../decorator/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: IUserRequest }>();
    if (!user) throw new ForbiddenException('User not found in request');

    const userLevel = RoleHierarchy[user.role];
    const minRequiredLevel = Math.min(...requiredRoles.map((role) => RoleHierarchy[role]));

    // Permitimos si el usuario tiene nivel >= al mínimo requerido
    if (userLevel >= minRequiredLevel) return true;

    throw new ForbiddenException('Insufficient role');
  }
}
