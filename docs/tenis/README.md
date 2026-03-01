# Tenis

Documentacion del modulo Tenis (MVP). Este modulo no esta registrado por defecto.

## Indice
- `docs/tenis/overview.md`
- `docs/tenis/domain-model.md`
- `docs/tenis/flows.md`
- `docs/tenis/state-machine.md`
- `docs/tenis/admin-commands.md`
- `docs/tenis/integrations.md`
- `docs/tenis/jobs.md`
- `docs/tenis/env.md`
- `docs/tenis/testing.md`

## Activacion del modulo
1) Importar `TenisModule` en `src/modules/webhook/webhook.module.ts`.
2) Importar `TenisModule` en `apps/api/app.module.ts`.

## Flags recomendados para MVP
- `ENABLE_WHATSAPP_OUTBOUND=true`
- `ENABLE_REDIS=true`
- `ENABLE_BULLMQ=true`
- `ENABLE_SHEETS=false` (activar si ya hay sheet configurado)
- `ENABLE_OPENAI=false` (activar cuando quieras routing por IA)

## Comandos usuario
- `/desafio <telefono|nombre|apodo>`
- `/apodo <alias>`
- `/apodos`
- `/apodo borrar <alias>`

## Scripts utiles
- `npm run seed:bot-registry`
- `npm run seed:tenis-names`

## Admin web
- Endpoint: `POST /admin/tenis/*` (ver `docs/tenis/admin-commands.md`)
- Header requerido: `x-admin-api-key`
