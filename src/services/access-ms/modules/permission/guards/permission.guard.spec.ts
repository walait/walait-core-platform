import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permission.guard';
import { PermissionService } from '../services/permission.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    permissionService = { listPermissions: jest.fn() } as any;
    guard = new PermissionsGuard(reflector, permissionService);
  });

  const createContext = (user?: any) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as any;

  it('returns true when no permissions are required', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('throws Unauthorized when no user is present', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['read']);
    await expect(guard.canActivate(createContext())).rejects.toThrow(UnauthorizedException);
  });

  it('throws Forbidden when user lacks permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['read']);
    (permissionService.listPermissions as jest.Mock).mockResolvedValue(['write']);
    await expect(guard.canActivate(createContext({ sub: '1' }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns true when permissions are satisfied', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['read']);
    (permissionService.listPermissions as jest.Mock).mockResolvedValue(['read']);
    await expect(guard.canActivate(createContext({ sub: '1' }))).resolves.toBe(true);
  });
});
