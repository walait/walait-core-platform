# Tenis - Overview MVP

Este modulo implementa el flujo MVP para desafios de tenis sobre WhatsApp.
El core (webhook, seguridad, integraciones) se mantiene reutilizable y el dominio
vive dentro de `src/modules/tenis`.

## Alcance MVP
- Registro automatico cuando el jugador escribe por primera vez.
- Desafios con registro mensual (sent/accepted) y validacion +/-10 puestos.
- Desafios por telefono, nombre o apodo (con seleccion en lista).
- Comandos de alias: /apodo, /apodos.
- Routing con OpenAI (opcional, con gating y confirmaciones).
- Endpoint admin web protegido por API key.
- Agenda con propuestas (hasta 3 opciones) y seleccion por el desafiado.
- Resultado con confirmacion del perdedor y disputa ante primer rechazo.
- Walkover y resolucion admin.
- Export a Google Sheets como snapshot.
- Jobs con BullMQ (expiraciones, export).

## Feature flags
- `ENABLE_REDIS=true|false`
- `ENABLE_BULLMQ=true|false`
- `ENABLE_SHEETS=true|false`
- `ENABLE_WHATSAPP_OUTBOUND=true|false`

## Estado actual del modulo
- El modulo `TenisModule` existe pero no esta registrado en `apps/api/app.module.ts`.
- El webhook enruta por `phone_number_id` usando el registro de bots en DB.
- `TENIS_PHONE_NUMBER_ID` queda como fallback por env.
- El webhook puede invocar el modulo si se registra o si se inyecta opcionalmente.
