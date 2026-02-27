import type { RoleType } from '@/modules/access/domain/types/role.type';

export interface IUserRequest {
  sub: string;
  sid: string;
  email: string;
  organization_id: string;
  role: RoleType;
}
