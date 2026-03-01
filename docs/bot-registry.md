# Bot registry (core)

Registro centralizado de bots WhatsApp para enrutar webhooks a modulos.

## Entidad
`bot_profiles`
- `id`
- `name`
- `phone_number_id` (UNIQUE)
- `handler_key` (enum)
- `is_active`
- `created_at`, `updated_at`

## Routing
- El webhook consulta por `phone_number_id`.
- Si `handler_key = TENIS`, se delega a `TenisService`.
- Si no hay registro en DB, se usa `TENIS_PHONE_NUMBER_ID` como fallback.

## Extensiones
- Agregar nuevos handlers en `BotHandlerKey` y mapear en `WebhookEventRouter`.

## Seed
- Script: `npm run seed:bot-registry`
- Requiere `TENIS_PHONE_NUMBER_ID` o `META_PHONE_NUMBER_ID`.
- Idempotente: actualiza si ya existe el phone_number_id.
