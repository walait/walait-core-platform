import { ScopeType } from "@/modules/organization/domain/types/scope.type";
// apps/access/services/role.service.spec.ts
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { type Mock, vi } from "vitest";
import { Role } from "../domain/model/role.entity";
import { RoleType } from "../domain/types/role.type";
import { RoleService } from "./role.service";

type MockRepo<T = unknown> = {
  [K in keyof Repository<T>]: Mock;
};

const createRepoMock = (): MockRepo =>
  ({
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  }) as unknown as MockRepo;

// ───────────────────────────────────────────
// Dummy data
// ───────────────────────────────────────────
const dummyRole = (overrides?: Partial<Role>): Role =>
  ({
    id: "role-1",
    name: "admin",
    scope: "organization",
    organization_id: "org-1",
    ...overrides,
  }) as Role;

// ───────────────────────────────────────────
// Test suite
// ───────────────────────────────────────────
describe("RoleService", () => {
  let service: RoleService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = createRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: getRepositoryToken(Role), useValue: repo },
      ],
    }).compile();

    service = module.get(RoleService);
    vi.clearAllMocks();
  });

  // ------------------------------------------------ createRole
  it("createRole crea y guarda un rol", async () => {
    const role = dummyRole();
    repo.create.mockReturnValue(role);
    repo.save.mockResolvedValue(role);

    const result = await service.createRole(
      "admin" as RoleType,
      "organization" as ScopeType,
      "org-1",
    );

    expect(repo.create).toHaveBeenCalledWith({
      name: "admin",
      scope: "organization",
      organization_id: "org-1",
    });
    expect(repo.save).toHaveBeenCalledWith(role);
    expect(result).toBe(role);
  });

  // ------------------------------------------------ getRoleById (ok)
  it("getRoleById devuelve rol si existe", async () => {
    const role = dummyRole();
    repo.findOne.mockResolvedValue(role);

    const res = await service.getRoleById("role-1");

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: "role-1" } });
    expect(res).toBe(role);
  });

  // ------------------------------------------------ getRoleById (not found)
  it("getRoleById lanza error si no existe", async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getRoleById("x")).rejects.toThrow("Role not found");
  });

  // ------------------------------------------------ getRoleByNameAndScope
  it("getRoleByNameAndScope busca por name y scope", async () => {
    const role = dummyRole();
    repo.findOne.mockResolvedValue(role);

    const res = await service.getRoleByNameAndScope(
      "admin" as RoleType,
      "organization",
    );

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { name: "admin", scope: "organization" },
    });
    expect(res).toBe(role);
  });

  // ------------------------------------------------ getAllRoles
  it("getAllRoles devuelve todos los roles", async () => {
    const roles = [dummyRole(), dummyRole({ id: "role-2", name: "member" })];
    repo.find.mockResolvedValue(roles);

    const res = await service.getAllRoles();

    expect(repo.find).toHaveBeenCalled();
    expect(res).toBe(roles);
  });

  // ------------------------------------------------ updateRole
  it("updateRole actualiza valores y guarda", async () => {
    const existing = dummyRole();
    repo.findOne.mockResolvedValue(existing); // para getRoleById
    repo.save.mockResolvedValue({
      ...existing,
      name: "owner",
      organization_id: "org-2",
    });

    const updated = await service.updateRole(
      "role-1",
      "owner" as RoleType,
      "organization" as ScopeType,
      "org-2",
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: "owner", organization_id: "org-2" }),
    );
    expect(updated.name).toBe("owner");
    expect(updated.organization_id).toBe("org-2");
  });
});
