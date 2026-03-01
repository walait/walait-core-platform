# Maquina de estados

Estados principales:
- `idle`
- `challenge_received`
- `awaiting_schedule`
- `awaiting_result_confirmation`
- `disputed`

Contexto (ConversationState.context):
- `current_challenge_id`
- `current_match_id`

Transiciones base:
- `idle` -> `challenge_received` al recibir desafio.
- `challenge_received` -> `awaiting_schedule` al aceptar.
- `awaiting_schedule` -> `awaiting_result_confirmation` al confirmar agenda.
- `awaiting_result_confirmation` -> `idle` al confirmar resultado.
- `awaiting_result_confirmation` -> `disputed` al rechazar resultado.
- `disputed` -> `idle` al resolver disputa.
