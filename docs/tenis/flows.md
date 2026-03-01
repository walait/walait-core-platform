# Flujos MVP

## Registro
- Si el Player no existe, se crea automaticamente.
- Se envia mensaje de bienvenida con comandos basicos.
- El jugador puede crear apodos con /apodo.
- Maximo 3 apodos activos por jugador.

## Desafio
1) Crear desafio
- Registrar limites mensuales (sent_count se incrementa, no bloquea).
- Calcular ranking actual (points desc, tie-breaker estable).
- Validar diferencia de puestos <= 10.
- Crear Challenge (PENDING, expires_at = now + 48h).
- Incrementar sent_count.
- Enviar botones Confirmar/Rechazar al desafiado.
- Encolar ExpireChallenge(challenge_id).

Busqueda de rival:
- Se acepta /desafio por telefono, nombre o apodo.
- Si hay multiples coincidencias, se envia lista para seleccionar.
- La lista muestra `display_name - phone_e164`.

2) Aceptar desafio
- Registrar limites mensuales del desafiado (accepted_count se incrementa, no bloquea).
- Challenge -> ACCEPTED, accepted_at.
- Guardar snapshot de ranking (challenger/challenged).
- Incrementar accepted_count.
- Crear Match (PENDING_SCHEDULE).
- Pedir propuestas al challenger (hasta 3).

3) Rechazar desafio
- Challenge -> REJECTED.
- Notificar a ambos.

4) Expirar desafio
- Si sigue PENDING y now >= expires_at -> EXPIRED.
- Notificar a ambos.

## Agenda
- Challenger propone 1..3 opciones:
  - EXACT: fecha+hora
  - SLOT: fecha + {MORNING, AFTERNOON, NIGHT}
- Desafiado elige opcion.
- Match.selected_schedule_option_id se actualiza.
- Match.status -> SCHEDULED (en esta etapa sin secretaria).
- Notificar a ambos.
- Si no se agenda en 48h desde que el match queda en PENDING_SCHEDULE, se cancela.

## Confirmacion de cancha (etapa futura)
- Comando admin: /cancha ok <matchId> [hh:mm]
- Match.status -> SCHEDULED
- Notificar a jugadores

## Resultado
- Ganador reporta: /resultado <matchId> 6-4 6-2
- Crear ResultReport (PENDING_CONFIRMATION)
- Match.status -> PENDING_RESULT_CONFIRMATION
- Enviar botones Confirmar/Rechazar al perdedor

### Confirmar
- ResultReport -> CONFIRMED
- Match -> CLOSED
- Aplicar puntos (winner += 125 + 5*dif, loser += 25)
- Recalcular ranking

### Rechazar
- ResultReport -> REJECTED
- Match -> DISPUTED
- Crear Dispute
- Notificar admin

## Walkover y resolucion
- /walkover <matchId> ganador=<player>
- /disputa resolver <matchId> 6-4 6-2
- /match cancelar <matchId>
