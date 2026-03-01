import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenisAndBotRegistry1762100000000 implements MigrationInterface {
  name = "AddTenisAndBotRegistry1762100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."bot_profiles_handler_key_enum" AS ENUM('TENIS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_player_roles_role_enum" AS ENUM('ADMIN', 'SECRETARY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_challenges_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_matches_status_enum" AS ENUM('PENDING_SCHEDULE', 'PENDING_COURT_CONFIRMATION', 'SCHEDULED', 'PENDING_RESULT_CONFIRMATION', 'DISPUTED', 'CLOSED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_schedule_proposals_status_enum" AS ENUM('OPEN', 'SELECTED', 'REPLACED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_schedule_options_kind_enum" AS ENUM('EXACT', 'SLOT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_schedule_options_slot_enum" AS ENUM('MORNING', 'AFTERNOON', 'NIGHT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_matches_scheduled_slot_enum" AS ENUM('MORNING', 'AFTERNOON', 'NIGHT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_result_reports_status_enum" AS ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_disputes_resolution_type_enum" AS ENUM('ADMIN_SET_SCORE', 'ADMIN_WALKOVER', 'ADMIN_CANCEL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenis_conversation_states_state_enum" AS ENUM('idle', 'challenge_received', 'awaiting_schedule', 'awaiting_result_confirmation', 'disputed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "bot_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "phone_number_id" character varying NOT NULL, "handler_key" "public"."bot_profiles_handler_key_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bot_profiles_phone_number_id" UNIQUE ("phone_number_id"), CONSTRAINT "PK_bot_profiles" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_e164" character varying NOT NULL, "display_name" character varying NOT NULL, "display_name_normalized" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tenis_players_phone" UNIQUE ("phone_e164"), CONSTRAINT "PK_tenis_players" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_player_aliases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "player_id" uuid NOT NULL, "alias" character varying NOT NULL, "alias_normalized" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenis_player_aliases" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenis_player_aliases_unique" ON "tenis_player_aliases" ("player_id", "alias_normalized")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenis_player_aliases_alias" ON "tenis_player_aliases" ("alias_normalized")`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_player_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_e164" character varying NOT NULL, "role" "public"."tenis_player_roles_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_tenis_player_roles_phone" UNIQUE ("phone_e164"), CONSTRAINT "PK_tenis_player_roles" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_player_stats" ("player_id" uuid NOT NULL, "points" integer NOT NULL DEFAULT 0, "rank_position" integer, "last_rank_recalc_at" TIMESTAMPTZ, CONSTRAINT "PK_tenis_player_stats" PRIMARY KEY ("player_id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_monthly_limits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "player_id" uuid NOT NULL, "yyyymm" integer NOT NULL, "sent_count" integer NOT NULL DEFAULT 0, "accepted_count" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_tenis_monthly_limits" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenis_monthly_limits_unique" ON "tenis_monthly_limits" ("player_id", "yyyymm")`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_challenges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "challenger_id" uuid NOT NULL, "challenged_id" uuid NOT NULL, "status" "public"."tenis_challenges_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMPTZ NOT NULL, "accepted_at" TIMESTAMPTZ, "rejected_at" TIMESTAMPTZ, "expired_at" TIMESTAMPTZ, "challenger_rank_at_create" integer, "challenged_rank_at_create" integer, CONSTRAINT "PK_tenis_challenges" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "challenge_id" uuid NOT NULL, "status" "public"."tenis_matches_status_enum" NOT NULL, "selected_schedule_option_id" uuid, "scheduled_start_at" TIMESTAMPTZ, "scheduled_slot" "public"."tenis_matches_scheduled_slot_enum", "scheduled_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tenis_matches_challenge" UNIQUE ("challenge_id"), CONSTRAINT "PK_tenis_matches" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_schedule_proposals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "match_id" uuid NOT NULL, "proposed_by_player_id" uuid NOT NULL, "status" "public"."tenis_schedule_proposals_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenis_schedule_proposals" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_schedule_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "proposal_id" uuid NOT NULL, "kind" "public"."tenis_schedule_options_kind_enum" NOT NULL, "start_at" TIMESTAMPTZ, "end_at" TIMESTAMPTZ, "date" date, "slot" "public"."tenis_schedule_options_slot_enum", "label" character varying NOT NULL, CONSTRAINT "PK_tenis_schedule_options" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_result_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "match_id" uuid NOT NULL, "reported_by_player_id" uuid NOT NULL, "score_raw" character varying NOT NULL, "status" "public"."tenis_result_reports_status_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "confirmed_at" TIMESTAMPTZ, "rejected_at" TIMESTAMPTZ, "confirmed_by_player_id" uuid, CONSTRAINT "UQ_tenis_result_reports_match" UNIQUE ("match_id"), CONSTRAINT "PK_tenis_result_reports" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_disputes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "match_id" uuid NOT NULL, "reason" text, "opened_at" TIMESTAMPTZ NOT NULL, "resolved_at" TIMESTAMPTZ, "resolved_by" character varying, "resolution_type" "public"."tenis_disputes_resolution_type_enum", CONSTRAINT "UQ_tenis_disputes_match" UNIQUE ("match_id"), CONSTRAINT "PK_tenis_disputes" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_type" character varying NOT NULL, "entity_id" character varying NOT NULL, "action" character varying NOT NULL, "actor_phone" character varying, "payload_json" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenis_audit_logs" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_conversation_states" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "player_id" uuid NOT NULL, "state" "public"."tenis_conversation_states_state_enum" NOT NULL, "context" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tenis_conversation_states" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenis_conversation_states_player" ON "tenis_conversation_states" ("player_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "tenis_inbound_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wa_message_id" character varying NOT NULL, "from_wa_id" character varying, "phone_number_id" character varying, "message_type" character varying, "payload_json" jsonb, "received_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tenis_inbound_messages_wa" UNIQUE ("wa_message_id"), CONSTRAINT "PK_tenis_inbound_messages" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenis_player_aliases" ADD CONSTRAINT "FK_tenis_player_aliases_player" FOREIGN KEY ("player_id") REFERENCES "tenis_players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_player_stats" ADD CONSTRAINT "FK_tenis_player_stats_player" FOREIGN KEY ("player_id") REFERENCES "tenis_players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_monthly_limits" ADD CONSTRAINT "FK_tenis_monthly_limits_player" FOREIGN KEY ("player_id") REFERENCES "tenis_players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_challenges" ADD CONSTRAINT "FK_tenis_challenges_challenger" FOREIGN KEY ("challenger_id") REFERENCES "tenis_players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_challenges" ADD CONSTRAINT "FK_tenis_challenges_challenged" FOREIGN KEY ("challenged_id") REFERENCES "tenis_players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_matches" ADD CONSTRAINT "FK_tenis_matches_challenge" FOREIGN KEY ("challenge_id") REFERENCES "tenis_challenges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_proposals" ADD CONSTRAINT "FK_tenis_schedule_proposals_match" FOREIGN KEY ("match_id") REFERENCES "tenis_matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_proposals" ADD CONSTRAINT "FK_tenis_schedule_proposals_player" FOREIGN KEY ("proposed_by_player_id") REFERENCES "tenis_players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_options" ADD CONSTRAINT "FK_tenis_schedule_options_proposal" FOREIGN KEY ("proposal_id") REFERENCES "tenis_schedule_proposals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_result_reports" ADD CONSTRAINT "FK_tenis_result_reports_match" FOREIGN KEY ("match_id") REFERENCES "tenis_matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_result_reports" ADD CONSTRAINT "FK_tenis_result_reports_player" FOREIGN KEY ("reported_by_player_id") REFERENCES "tenis_players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_disputes" ADD CONSTRAINT "FK_tenis_disputes_match" FOREIGN KEY ("match_id") REFERENCES "tenis_matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_conversation_states" ADD CONSTRAINT "FK_tenis_conversation_states_player" FOREIGN KEY ("player_id") REFERENCES "tenis_players"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenis_conversation_states" DROP CONSTRAINT "FK_tenis_conversation_states_player"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_disputes" DROP CONSTRAINT "FK_tenis_disputes_match"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_result_reports" DROP CONSTRAINT "FK_tenis_result_reports_player"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_result_reports" DROP CONSTRAINT "FK_tenis_result_reports_match"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_options" DROP CONSTRAINT "FK_tenis_schedule_options_proposal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_proposals" DROP CONSTRAINT "FK_tenis_schedule_proposals_player"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_schedule_proposals" DROP CONSTRAINT "FK_tenis_schedule_proposals_match"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_matches" DROP CONSTRAINT "FK_tenis_matches_challenge"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_challenges" DROP CONSTRAINT "FK_tenis_challenges_challenged"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_challenges" DROP CONSTRAINT "FK_tenis_challenges_challenger"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_monthly_limits" DROP CONSTRAINT "FK_tenis_monthly_limits_player"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_player_stats" DROP CONSTRAINT "FK_tenis_player_stats_player"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenis_player_aliases" DROP CONSTRAINT "FK_tenis_player_aliases_player"`,
    );

    await queryRunner.query(`DROP TABLE "tenis_inbound_messages"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tenis_conversation_states_player"`);
    await queryRunner.query(`DROP TABLE "tenis_conversation_states"`);
    await queryRunner.query(`DROP TABLE "tenis_audit_logs"`);
    await queryRunner.query(`DROP TABLE "tenis_disputes"`);
    await queryRunner.query(`DROP TABLE "tenis_result_reports"`);
    await queryRunner.query(`DROP TABLE "tenis_schedule_options"`);
    await queryRunner.query(`DROP TABLE "tenis_schedule_proposals"`);
    await queryRunner.query(`DROP TABLE "tenis_matches"`);
    await queryRunner.query(`DROP TABLE "tenis_challenges"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tenis_monthly_limits_unique"`);
    await queryRunner.query(`DROP TABLE "tenis_monthly_limits"`);
    await queryRunner.query(`DROP TABLE "tenis_player_stats"`);
    await queryRunner.query(`DROP TABLE "tenis_player_roles"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tenis_player_aliases_alias"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tenis_player_aliases_unique"`);
    await queryRunner.query(`DROP TABLE "tenis_player_aliases"`);
    await queryRunner.query(`DROP TABLE "tenis_players"`);
    await queryRunner.query(`DROP TABLE "bot_profiles"`);

    await queryRunner.query(`DROP TYPE "public"."tenis_conversation_states_state_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_disputes_resolution_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_result_reports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_matches_scheduled_slot_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_schedule_options_slot_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_schedule_options_kind_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_schedule_proposals_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_matches_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_challenges_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenis_player_roles_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."bot_profiles_handler_key_enum"`);
  }
}
