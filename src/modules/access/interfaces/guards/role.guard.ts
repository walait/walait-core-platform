import type { IUserRequest } from '@/services/identity-ms/modules/user/model/user.interface';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RoleHierarchy } from '../../domain/constants/role-hierarchy.constant';
import type { RoleType } from '../../domain/types/role.type';
import { ROLES_KEY } from '../decorators/role.decorator';

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
