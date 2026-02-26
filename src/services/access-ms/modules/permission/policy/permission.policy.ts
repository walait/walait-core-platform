import { UserRole } from '../../user-roles/model/user-role.entity';

export function canAccessOrOwnsResource(
  userRoles: UserRole[],
  action: string,
  targetUserId: string,
  requesterId: string,
): boolean {
  const privileged = ['admin', 'superadmin'];
  const hasPrivRole = userRoles.some((ur) => privileged.includes(ur.role.name));
  const hasPerm = userRoles
    .flatMap((ur) => ur.role.rolePermissions)
    .some((rp) => rp.permission.name === action);

  return (hasPrivRole && hasPerm) || requesterId === targetUserId;
}
