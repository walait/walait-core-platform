import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './role.guard';
import { IUserRequest } from '@/services/identity-ms/modules/user/model/user.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  const createContext = (user?: Partial<IUserRequest>) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as any;

  it('allows when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws Forbidden when user missing or role insufficient', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext({ role: 'member' }))).toThrow(ForbiddenException);
  });

  it('allows when user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
    expect(guard.canActivate(createContext({ role: 'admin' }))).toBe(true);
  });
});
