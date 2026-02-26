import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@/services/access-ms/modules/role/types/role.type';

export const ROLES_KEY = 'role';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
