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

Apps/entrypoints:

- `apps/api/main.ts`
- `apps/api/app.module.ts`

## Requisitos

- Node.js 20+
- Postgres
- npm

## Configuracion

Crear `.env` en la raiz del proyecto. Variables clave:

- `DATABASE_URL`
- `PKI_MASTER_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

Notas:

- El setup de tests e2e usa `PKI_MASTER_SECRET` (ver `test/vitest.setup.ts`).
- Vitest silencia el warning de Vite CJS con `VITE_CJS_IGNORE_WARNING=1` en los scripts.
- Para webhooks de WhatsApp, usar `WHATSAPP_VERIFY_TOKEN` y revisar `.env.example`.

## Scripts utiles

Instalar dependencias:

```
npm install
```

Desarrollo:

```
npm run start:dev
```

## WhatsApp Cloud API (webhooks)

Endpoints:

- `GET /webhook` (verificacion de Meta)
- `POST /webhook` (recepcion de eventos)

Prueba de verificacion:

```bash
curl -i "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=change_me&hub.challenge=12345"
```

Prueba de webhook POST:

```bash
curl -i -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"field":"messages","value":{"metadata":{"phone_number_id":"987654"},"contacts":[{"profile":{"name":"Jane Doe"},"wa_id":"5491112345678"}],"messages":[{"from":"5491112345678","id":"wamid.HBgMNTQ5MTExMjM0NTY3OA==","timestamp":"1710000000","type":"text","text":{"body":"Hola"}}]}}]}]}'
```

Archivos generados:

- `data/webhooks.jsonl` (payload raw)
- `data/events.jsonl` (eventos normalizados)

Notas de produccion:

- HTTPS obligatorio para Meta.
- Responder 200 rapido; el procesamiento pesado debe ser asincronico.
- La idempotencia es in-memory con TTL (6h) y no persiste reinicios.
- Sugerencia de deploy: Render, Railway o AWS.

### Railway

- Railway expone una URL publica. Usa esa URL como webhook en Meta.
- El servidor debe escuchar en `0.0.0.0:$PORT` (configurado por defecto con `HOST=0.0.0.0`).
- Webhook: `https://<tu-app>.up.railway.app/webhook`.

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

## Apps y builds

La app por defecto es `api`. Se compila y se ejecuta solo lo que esta importado en `apps/api/app.module.ts`.

Para agregar un nuevo app:

1. Crear `apps/<app>/main.ts` y `apps/<app>/app.module.ts`.
2. Registrar el proyecto en `nest-cli.json`.
3. Crear `tsconfig.build.<app>.json` con los `include` necesarios.
4. Agregar scripts `build:<app>` y `start:<app>` en `package.json`.

Para quitar un modulo de una app:

1. Eliminar el import en `apps/<app>/app.module.ts`.
2. Remover el path del modulo en `tsconfig.build.<app>.json`.

## Notas de testing

- Unit tests: `src/**/*.spec.ts`
- E2E: `test/**/*.e2e-spec.ts`
- Configs: `vitest.config.ts` y `vitest.e2e.config.ts`

## Convenciones

- Imports internos con alias `@` (ver `vitest.config.ts`).
- Entities bajo `src/modules/**/domain/model/*.entity.ts`.
