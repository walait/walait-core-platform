import { ScheduleSlot } from "./tenis.enums";

export enum TenisIntent {
  CHALLENGE_CREATE = "CHALLENGE_CREATE",
  CHALLENGE_ACCEPT = "CHALLENGE_ACCEPT",
  CHALLENGE_REJECT = "CHALLENGE_REJECT",
  SCHEDULE_PROPOSE = "SCHEDULE_PROPOSE",
  SCHEDULE_SELECT = "SCHEDULE_SELECT",
  RESULT_REPORT = "RESULT_REPORT",
  RESULT_CONFIRM = "RESULT_CONFIRM",
  RESULT_REJECT = "RESULT_REJECT",
  RANKING_QUERY = "RANKING_QUERY",
  HELP = "HELP",
  ADMIN_COMMAND = "ADMIN_COMMAND",
  UNKNOWN = "UNKNOWN",
}

export interface TenisIntentEntities {
  opponent_name?: string;
  opponent_phone?: string;
  match_id?: string;
  report_id?: string;
  score?: string;
  date?: string;
  time?: string;
  slot?: ScheduleSlot;
}

export interface TenisIntentResult {
  intent: TenisIntent;
  confidence: number;
  entities: TenisIntentEntities;
  needs_clarification: boolean;
  clarifying_question?: string;
}
