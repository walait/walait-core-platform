import type { IUserRequest } from '@/modules/identity/domain/user.interface';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { vi } from 'vitest';
import { RolesGuard } from './role.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  const createContext = (user?: Partial<IUserRequest>) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as {
      getHandler: () => null;
      getClass: () => null;
      switchToHttp: () => { getRequest: () => { user?: Partial<IUserRequest> } };
    };

  it('allows when no roles are required', () => {
    (reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('throws Forbidden when user missing or role insufficient', () => {
    (reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['admin']);
    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext({ role: 'member' }))).toThrow(ForbiddenException);
  });

  it('allows when user has required role', () => {
    (reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['admin']);
    expect(guard.canActivate(createContext({ role: 'admin' }))).toBe(true);
  });
});
