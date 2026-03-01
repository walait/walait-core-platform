# Integraciones

## WhatsApp Cloud API
- Webhook: `GET /webhook` + `POST /webhook` (firma HMAC).
- Envio: `POST /{PHONE_NUMBER_ID}/messages` con Bearer token.
- Interactivos:
  - Botones Confirmar/Rechazar.
  - Listas para seleccionar agenda.

## Google Sheets
- Service account.
- Escritura por batch con `spreadsheets.values.batchUpdate`.
- Sheets:
  - Ranking
  - Partidos
  - Disputas

## OpenAI (etapa futura)
- Responses API + Structured Outputs.
- Solo clasificar intencion, no ejecutar acciones criticas sin confirmacion.
- Gating por estado/commands y cache en memoria para reducir llamadas.
- Umbral recomendado: `confidence >= 0.75`.
