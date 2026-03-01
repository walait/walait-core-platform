import { ScheduleOptionKind, ScheduleSlot } from "./tenis.enums";

export interface ScheduleOptionInput {
  kind: ScheduleOptionKind;
  startAt?: Date;
  endAt?: Date;
  date?: string;
  slot?: ScheduleSlot;
  label: string;
}

export interface ScheduleSelectionResult {
  ok: boolean;
  reason?: string;
}
