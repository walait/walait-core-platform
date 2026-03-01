# Testing

Estrategia:
- Tests unitarios por servicio (`*.spec.ts`).
- Escenarios criticos: limites mensuales, +/-10 ranking, puntos, idempotencia.

Casos sugeridos:
- `LimitsService`: bloqueos por mes y reinicio en nuevo mes.
- `RankingService`: orden estable y snapshot.
- `ChallengeService`: validacion +/-10 y limites.
- `ResultService`: confirmacion, rechazo y disputa.
- `AdminCommands`: parsing estricto.
- `PlayerAliasService`: limite 3, reactivacion.
- `PlayerSearchService`: busqueda parcial y por telefono.

Comandos:
- `npm test`
- `npm run seed:bot-registry`
- `npm run seed:tenis-names`
- `npm run typeorm:run` (aplica migraciones)
