import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

import { PermissionService } from "../../application/permission.service";
import { PermissionsGuard } from "./permission.guard";
import { Reflector } from "@nestjs/core";
import { vi } from "vitest";

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let permissionService: PermissionService;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as unknown as Reflector;
    permissionService = {
      listPermissions: vi.fn(),
    } as unknown as PermissionService;
    guard = new PermissionsGuard(reflector, permissionService);
  });

  const createContext = (user?: unknown) =>
    ({
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as {
      getHandler: () => null;
      getClass: () => null;
      switchToHttp: () => { getRequest: () => { user?: unknown } };
    };

  it("returns true when no permissions are required", async () => {
    (
      reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(undefined);
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it("throws Unauthorized when no user is present", async () => {
    (
      reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(["read"]);
    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("throws Forbidden when user lacks permission", async () => {
    (
      reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(["read"]);
    (
      permissionService.listPermissions as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(["write"]);
    await expect(
      guard.canActivate(createContext({ sub: "1" })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("returns true when permissions are satisfied", async () => {
    (
      reflector.getAllAndOverride as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue(["read"]);
    (
      permissionService.listPermissions as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(["read"]);
    await expect(guard.canActivate(createContext({ sub: "1" }))).resolves.toBe(
      true,
    );
  });
});
