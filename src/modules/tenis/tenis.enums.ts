export enum PlayerRoleType {
  ADMIN = "ADMIN",
  SECRETARY = "SECRETARY",
}

export enum ChallengeStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum MatchStatus {
  PENDING_SCHEDULE = "PENDING_SCHEDULE",
  PENDING_COURT_CONFIRMATION = "PENDING_COURT_CONFIRMATION",
  SCHEDULED = "SCHEDULED",
  PENDING_RESULT_CONFIRMATION = "PENDING_RESULT_CONFIRMATION",
  DISPUTED = "DISPUTED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export enum ScheduleProposalStatus {
  OPEN = "OPEN",
  SELECTED = "SELECTED",
  REPLACED = "REPLACED",
}

export enum ScheduleOptionKind {
  EXACT = "EXACT",
  SLOT = "SLOT",
}

export enum ScheduleSlot {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  NIGHT = "NIGHT",
}

export enum ResultReportStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
}

export enum DisputeResolutionType {
  ADMIN_SET_SCORE = "ADMIN_SET_SCORE",
  ADMIN_WALKOVER = "ADMIN_WALKOVER",
  ADMIN_CANCEL = "ADMIN_CANCEL",
}

export enum ConversationFlowState {
  IDLE = "idle",
  CHALLENGE_RECEIVED = "challenge_received",
  AWAITING_SCHEDULE = "awaiting_schedule",
  AWAITING_RESULT_CONFIRMATION = "awaiting_result_confirmation",
  DISPUTED = "disputed",
}
