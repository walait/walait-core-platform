import { RoleType } from '../../../../access-ms/modules/role/types/role.type';

export interface IUserRequest {
  sub: string;
  sid: string;
  email: string;
  organization_id: string;
  role: RoleType;
}
