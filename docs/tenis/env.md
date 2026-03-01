# Variables de entorno

## Core
- `PORT`
- `TZ=America/Argentina/Cordoba`
- `DATABASE_URL`

## WhatsApp
- `META_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`
- `META_PHONE_NUMBER_ID`
- `META_API_VERSION`
- `TENIS_PHONE_NUMBER_ID` (fallback si no hay bot en DB)

Compatibles:
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

## Flags
- `ENABLE_REDIS`
- `ENABLE_BULLMQ`
- `ENABLE_SHEETS`
- `ENABLE_WHATSAPP_OUTBOUND`
- `ENABLE_OPENAI`

## Redis
- `REDIS_URL`

## Sheets
- `SHEETS_SPREADSHEET_ID`
- `SHEETS_EXPORT_CRON` (ej: `0 9 * * *`)
- `GOOGLE_SERVICE_ACCOUNT_JSON`

## OpenAI (futuro)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Admin web
- `ADMIN_API_KEY` (header `x-admin-api-key`)
