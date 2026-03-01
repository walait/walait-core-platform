# Modelo de datos (Postgres)

## Player
- `id` UUID
- `phone_e164` UNIQUE
- `display_name`
- `display_name_normalized`
- `is_active`
- `created_at`, `updated_at`

## PlayerAlias
- `id` UUID
- `player_id` FK
- `alias`
- `alias_normalized`
- `is_active`
- `created_at`, `updated_at`

## PlayerRole
- `id` UUID
- `phone_e164` UNIQUE
- `role` ENUM(ADMIN, SECRETARY)
- `is_active`

## PlayerStats
- `player_id` PK/FK
- `points` INT (default 0)
- `rank_position` INT nullable
- `last_rank_recalc_at`

## MonthlyLimits
- `id` UUID
- `player_id` FK
- `yyyymm` INT (ej: 202604)
- `sent_count` INT (registro, no bloquea)
- `accepted_count` INT (registro, no bloquea)
- UNIQUE(player_id, yyyymm)

## Challenge
- `id` UUID
- `challenger_id` FK
- `challenged_id` FK
- `status` ENUM(PENDING, ACCEPTED, REJECTED, EXPIRED, CANCELLED)
- `created_at`
- `expires_at` (created + 48h)
- `accepted_at`, `rejected_at`, `expired_at`
- `challenger_rank_at_create`
- `challenged_rank_at_create`

## Match
- `id` UUID
- `challenge_id` UNIQUE FK
- `status` ENUM(PENDING_SCHEDULE, PENDING_COURT_CONFIRMATION, SCHEDULED, PENDING_RESULT_CONFIRMATION, DISPUTED, CLOSED, CANCELLED)
- `selected_schedule_option_id`
- `scheduled_start_at`
- `scheduled_slot` ENUM(MORNING, AFTERNOON, NIGHT)
- `scheduled_date` (YYYY-MM-DD)
- `created_at`, `updated_at`

## ScheduleProposal
- `id` UUID
- `match_id` FK
- `proposed_by_player_id`
- `status` ENUM(OPEN, SELECTED, REPLACED)
- `created_at`

## ScheduleOption
- `id` UUID
- `proposal_id` FK
- `kind` ENUM(EXACT, SLOT)
- `start_at`, `end_at` (EXACT)
- `date`, `slot` (SLOT)
- `label`

## ResultReport
- `id` UUID
- `match_id` UNIQUE FK
- `reported_by_player_id`
- `score_raw`
- `status` ENUM(PENDING_CONFIRMATION, CONFIRMED, REJECTED)
- `created_at`
- `confirmed_at`, `rejected_at`
- `confirmed_by_player_id`

## Dispute
- `id` UUID
- `match_id` UNIQUE FK
- `reason` text nullable
- `opened_at`
- `resolved_at`
- `resolved_by` (admin phone)
- `resolution_type` ENUM(ADMIN_SET_SCORE, ADMIN_WALKOVER, ADMIN_CANCEL)

## AuditLog
- `id` UUID
- `entity_type`, `entity_id`
- `action`
- `actor_phone`
- `payload_json`
- `created_at`

## ConversationState
- `id` UUID
- `player_id` UNIQUE FK
- `state` ENUM(idle, challenge_received, awaiting_schedule, awaiting_result_confirmation, disputed)
- `context` JSON
- `created_at`, `updated_at`

## InboundMessage
- `id` UUID
- `wa_message_id` UNIQUE
- `from_wa_id`
- `phone_number_id`
- `message_type`
- `payload_json`
- `received_at`
