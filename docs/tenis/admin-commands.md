# Comandos admin

Comandos estricos (solo ADMIN/SECRETARY):

- `/cancha ok <matchId> [hh:mm]`
  - Confirma cancha manualmente.

- `/disputa resolver <matchId> 6-4 6-2`
  - Resuelve disputa y cierra el match.

- `/walkover <matchId> ganador=<telefono>`
  - Aplica walkover con puntaje normal.

- `/match cancelar <matchId>`
  - Cancela match sin puntos.

- `/export sheets`
  - Encola export completo a Google Sheets.

Nota: se deja preparado el camino para un endpoint web en etapas futuras.

## Endpoint web (admin)
Header requerido: `x-admin-api-key`.

- `POST /admin/tenis/export`
- body: `{}`
- `POST /admin/tenis/walkover`
- body: `{ "matchId": "...", "winnerPhone": "..." }`
- `POST /admin/tenis/disputa/resolve`
- body: `{ "matchId": "...", "score": "6-4 6-2" }`
- `POST /admin/tenis/match/cancel`
- body: `{ "matchId": "..." }`
- `POST /admin/tenis/cancha/ok`
- body: `{ "matchId": "...", "time": "18:30" }`
