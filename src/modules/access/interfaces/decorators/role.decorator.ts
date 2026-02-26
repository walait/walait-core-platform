import { SetMetadata } from '@nestjs/common';
import type { RoleType } from '../../domain/types/role.type';

export const ROLES_KEY = 'role';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
