# Jobs (BullMQ)

Jobs minimos:
- `expireChallenge` (ejecuta en expires_at).
- `expireSchedule` (cancela match si sigue PENDING_SCHEDULE despues de 48h).
- `exportSheets` (manual o cron).

Feature flags:
- `ENABLE_REDIS=true|false`
- `ENABLE_BULLMQ=true|false`
- `ENABLE_SHEETS=true|false` (para cron de export)

Cron export:
- `SHEETS_EXPORT_CRON` (ej: `0 9 * * *`)
- Requiere `ENABLE_SHEETS=true` + BullMQ/Redis activos.

Idempotencia:
- Cada job valida estado actual antes de actuar.
