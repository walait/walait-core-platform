// apps/access/services/permission.service.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type Mock, vi } from 'vitest';
import { UserRole } from '../domain/model/user-role.entity';
import { PermissionService } from './permission.service';

// ───────────────────────────────────────────
// Mock factory del repo
// ───────────────────────────────────────────
const repoMock = () =>
  ({
    find: vi.fn(),
  }) as unknown as { find: Mock };

// ───────────────────────────────────────────
// Datos dummy
// ───────────────────────────────────────────
const makeUserRole = (userId: string, roleName: string, perms: string[]): UserRole =>
  ({
    id: `${roleName}-ur`,
    user_id: userId,
    role: {
      name: roleName,
      rolePermissions: perms.map(
        (name) =>
          ({
            permission: { name },
          }) as { permission: { name: string } },
      ),
    } as { name: string; rolePermissions: { permission: { name: string } }[] },
  }) as UserRole;

describe('PermissionService', () => {
  let service: PermissionService;
  let urRepo: { find: Mock };

  const USER_ID = 'u-1';

  beforeEach(async () => {
    urRepo = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService, { provide: getRepositoryToken(UserRole), useValue: urRepo }],
    }).compile();

    service = module.get(PermissionService);
    vi.clearAllMocks();
  });

  // ───────────────── listPermissions
  describe('listPermissions', () => {
    it('devuelve permisos únicos de todas las roles', async () => {
      urRepo.find.mockResolvedValue([
        makeUserRole(USER_ID, 'admin', ['read', 'write']),
        makeUserRole(USER_ID, 'member', ['read']), // duplicado 'read'
      ]);

      const perms = await service.listPermissions(USER_ID);

      expect(perms.sort()).toEqual(['read', 'write']);
      expect(urRepo.find).toHaveBeenCalledWith({
        where: { user_id: USER_ID },
        relations: ['role', 'role.permissions'],
      });
    });
  });

  // ───────────────── hasPermission
  describe('hasPermission', () => {
    it('true si el permiso está presente', async () => {
      urRepo.find.mockResolvedValue([makeUserRole(USER_ID, 'admin', ['export'])]);

      const ok = await service.hasPermission(USER_ID, 'export');
      expect(ok).toBe(true);
    });

    it('false si el permiso NO está presente', async () => {
      urRepo.find.mockResolvedValue([makeUserRole(USER_ID, 'member', ['read'])]);

      const ok = await service.hasPermission(USER_ID, 'delete');
      expect(ok).toBe(false);
    });
  });

  // ───────────────── hasRoleOrHigher
  describe('hasRoleOrHigher', () => {
    it('true si el usuario tiene rol igual o superior', async () => {
      // user es 'owner', required 'admin' -> debería pasar
      urRepo.find.mockResolvedValue([makeUserRole(USER_ID, 'owner', [])]);

      const ok = await service.hasRoleOrHigher(USER_ID, 'admin');
      expect(ok).toBe(true);
    });

    it('false si el usuario no llega al nivel requerido', async () => {
      urRepo.find.mockResolvedValue([makeUserRole(USER_ID, 'member', [])]);

      const ok = await service.hasRoleOrHigher(USER_ID, 'owner');
      expect(ok).toBe(false);
    });
  });
});
