# WalaItCorePlatform

Backend monolitico con arquitectura modular basado en NestJS. El codigo se organiza en `src/modules/*` por dominio y se integra con TypeORM, eventos y microservicios.

## Arquitectura y modulos

Estructura base de un modulo:

```
src/modules/<dominio>/
  application/
  domain/
  infrastructure/
  interfaces/
```

Modulos principales actuales:

- `src/modules/access`
- `src/modules/admin`
- `src/modules/email`
- `src/modules/identity`
- `src/modules/organization`
- `src/modules/taxes`

Entrada principal:

- `src/app.module.ts`

## Requisitos

- Node.js 20+
- Postgres
- npm

## Configuracion

Crear `.env` en la raiz del proyecto. Variables clave:

- `DATABASE_URL`
- `PKI_MASTER_SECRET`

Notas:

- El setup de tests e2e usa `PKI_MASTER_SECRET` (ver `test/vitest.setup.ts`).
- Vitest silencia el warning de Vite CJS con `VITE_CJS_IGNORE_WARNING=1` en los scripts.

## Scripts utiles

Instalar dependencias:

```
npm install
```

Desarrollo:

```
npm run start:dev
```

Build:

```
npm run build
```

Tests:

```
npm test
npm run test:e2e
```

Lint y formato:

```
npm run lint
npm run lint-fix
npm run lint:biome
npm run format
npm run format:biome
```

Seeds y base de datos:

```
npm run seed
npm run clean:db
```

Migraciones TypeORM:

```
npm run typeorm:create
npm run typeorm:generate
npm run typeorm:run
npm run typeorm:revert
```

## Notas de testing

- Unit tests: `src/**/*.spec.ts`
- E2E: `test/**/*.e2e-spec.ts`
- Configs: `vitest.config.ts` y `vitest.e2e.config.ts`

## Convenciones

- Imports internos con alias `@` (ver `vitest.config.ts`).
- Entities bajo `src/modules/**/domain/model/*.entity.ts`.
