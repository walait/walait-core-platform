import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Permission } from '@/services/access-ms/modules/permission/model/permission.entity';
import { RolePermission } from '@/services/access-ms/modules/role-permission/model/role-permission.entity';
import { Role } from '@/services/access-ms/modules/role/model/role.entity';
import { RoleType } from '@/services/access-ms/modules/role/types/role.type';
import { ScopeType } from '@/services/organization-ms/modules/orgnanization/types/scope.type';

config({ path: '.env' }); // Load env variables

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.{ts,js}'],
  migrations: ['src/migrations/**/*.{ts,js}'],
  synchronize: false,
  logging: false,
});

const permissions = [
  { name: 'read:project', description: 'Ver proyectos' },
  { name: 'create:project', description: 'Crear proyectos' },
  { name: 'update:project', description: 'Editar proyectos' },
  { name: 'delete:project', description: 'Eliminar proyectos' },
  { name: 'manage:users', description: 'Gestionar usuarios' },
];

const roles = [
  {
    name: 'superadmin' as RoleType,
    scope: 'global' as ScopeType,
    permissions: [
      'read:project',
      'create:project',
      'update:project',
      'delete:project',
      'manage:users',
    ],
  },
  {
    name: 'member' as RoleType,
    scope: 'organization' as ScopeType,
    permissions: ['read:project'],
  },
  {
    name: 'admin' as RoleType,
    scope: 'organization' as ScopeType,
    permissions: ['read:project', 'update:project', 'manage:users'],
  },
  {
    name: 'owner' as RoleType,
    scope: 'organization' as ScopeType,
    permissions: [
      'read:project',
      'create:project',
      'update:project',
      'delete:project',
      'manage:users',
    ],
  },
];

async function seed() {
  await AppDataSource.initialize();
  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const rolePermRepo = AppDataSource.getRepository(RolePermission);

  const permsMap = new Map<string, Permission>();

  for (const p of permissions) {
    let perm = await permRepo.findOneBy({ name: p.name });
    if (!perm) {
      perm = permRepo.create(p);
      await permRepo.save(perm);
    }
    permsMap.set(p.name, perm);
  }

  for (const r of roles) {
    let role = await roleRepo.findOneBy({ name: r.name });
    if (!role) {
      role = roleRepo.create({ name: r.name, scope: r.scope });
      role = await roleRepo.save(role);
    }

    for (const permName of r.permissions) {
      const permission = permsMap.get(permName);
      const exists = await rolePermRepo.findOneBy({
        role: { id: role.id },
        permission: { id: permission.id },
      });
      if (!exists) {
        await rolePermRepo.save(rolePermRepo.create({ role, permission }));
      }
    }
  }

  await AppDataSource.destroy();
}

seed()
  .then(() => {
    console.log('✅ Seed complete');
  })
  .catch((err) => {
    console.error('❌ Error during seed:', err);
    AppDataSource.destroy();
  });
