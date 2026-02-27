import { ScopeType } from "@/modules/organization/domain/types/scope.type";
import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { type Mock, vi } from "vitest";
import { Role } from "../domain/model/role.entity";
import { UserRole } from "../domain/model/user-role.entity";
import { RoleService } from "./role.service";
import { UserRoleService } from "./user-role.service";

describe("UserRoleService", () => {
  let service: UserRoleService;
  let repo: { [K in keyof Repository<UserRole>]: Mock };
  let roleService: { getRoleByNameAndScope: Mock };

  const role: Role = { id: "role-1", name: "admin" } as Role;
  const userRole: UserRole = {
    id: "ur-1",
    user_id: "user-123",
    role_id: "role-1",
    role: null,
    scope: "organization" as ScopeType,
    organization_id: "123",
  } as UserRole;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            getRoleByNameAndScope: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserRoleService);
    repo = module.get(getRepositoryToken(UserRole));
    roleService = module.get(RoleService);
    vi.clearAllMocks();
  });

  describe("createUserRole", () => {
    it("should create user role with Role instance", async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(userRole);
      repo.save.mockResolvedValue(userRole);

      const result = await service.createUserRole({
        user_id: "user-1",
        role,
        scope: "organization" as ScopeType,
        organization_id: "123",
      });

      expect(repo.create).toHaveBeenCalledWith({
        user_id: "user-1",
        role,
        scope: "organization" as ScopeType,
        organization_id: "123",
      });
      expect(result).toEqual(userRole);
    });

    it("should return existing user role if already assigned", async () => {
      repo.findOne.mockResolvedValue(userRole);

      const result = await service.createUserRole({
        user_id: "user-1",
        role,
        scope: "organization" as ScopeType,
        organization_id: "123",
      });

      expect(repo.create).not.toHaveBeenCalled();
      expect(result).toEqual(userRole);
    });
  });

  describe("findByUserId", () => {
    it("should find roles by user ID", async () => {
      repo.find.mockResolvedValue([userRole]);
      const result = await service.findByUserId("user-1");
      expect(result).toEqual([userRole]);
    });
  });

  describe("findByRoleId", () => {
    it("should find roles by role ID", async () => {
      repo.find.mockResolvedValue([userRole]);
      const result = await service.findByRoleId(role.id);
      expect(result).toEqual([userRole]);
    });
  });

  describe("findByUserIdAndRoleId", () => {
    it("should find one user-role by user and role ID", async () => {
      repo.findOne.mockResolvedValue(userRole);
      const result = await service.findByUserIdAndRoleId("user-1", role.id);
      expect(result).toEqual(userRole);
    });
  });

  describe("assignRoleToUser", () => {
    it("should create and assign role to user", async () => {
      repo.create.mockReturnValue(userRole);
      repo.save.mockResolvedValue(userRole);

      const result = await service.assignRoleToUser("user-1", role.id);
      expect(result).toEqual(userRole);
    });
  });

  describe("removeRoleFromUser", () => {
    it("should remove role if found", async () => {
      repo.findOne.mockResolvedValue(userRole);
      await service.removeRoleFromUser("user-1", role.id);
      expect(repo.remove).toHaveBeenCalledWith(userRole);
    });

    it("should not call remove if user-role not found", async () => {
      repo.findOne.mockResolvedValue(null);
      await service.removeRoleFromUser("user-1", role.id);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe("getAllUserRoles", () => {
    it("should return all user roles", async () => {
      repo.find.mockResolvedValue([userRole]);
      const result = await service.getAllUserRoles();
      expect(result).toEqual([userRole]);
    });
  });

  describe("getUserRolesByUserId", () => {
    it("should return all roles for a user", async () => {
      repo.find.mockResolvedValue([userRole]);
      const result = await service.getUserRolesByUserId("user-1");
      expect(result).toEqual([userRole]);
    });
  });

  describe("getAdminRole", () => {
    it("should return role if found", async () => {
      roleService.getRoleByNameAndScope.mockResolvedValue(role);
      const result = await service.getAdminRole("superadmin");
      expect(result).toEqual(role);
    });

    it("should throw if admin role not found", async () => {
      roleService.getRoleByNameAndScope.mockResolvedValue(null);
      await expect(service.getAdminRole("admin")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
