import { describe, expect, it, vi } from "vitest";
import { MatchStatus, ScheduleOptionKind } from "../tenis.enums";
import { ScheduleService } from "./schedule.service";

describe("ScheduleService", () => {
  it("rejects proposal when match missing", async () => {
    const matchRepo = { findOne: vi.fn().mockResolvedValue(null) } as any;
    const challengeRepo = {} as any;
    const playerRepo = {} as any;
    const proposalRepo = {} as any;
    const optionRepo = {} as any;
    const whatsapp = { sendScheduleOptions: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ScheduleService(
      matchRepo,
      challengeRepo,
      playerRepo,
      proposalRepo,
      optionRepo,
      whatsapp,
      audit,
    );

    const result = await service.proposeSchedule("m1", { id: "p1" } as any, []);
    expect(result.ok).toBe(false);
  });

  it("accepts proposal for pending match", async () => {
    const matchRepo = {
      findOne: vi.fn().mockResolvedValue({ id: "m1", status: MatchStatus.PENDING_SCHEDULE }),
      save: vi.fn(),
    } as any;
    const challengeRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: "c1",
        challenger_id: "p1",
        challenged_id: "p2",
      }),
    } as any;
    const playerRepo = { findOne: vi.fn().mockResolvedValue({ phone_e164: "5491" }) } as any;
    const proposalRepo = { create: vi.fn((v) => v), save: vi.fn((v) => v) } as any;
    const optionRepo = { create: vi.fn((v) => v), save: vi.fn((v) => v) } as any;
    const whatsapp = { sendScheduleOptions: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ScheduleService(
      matchRepo,
      challengeRepo,
      playerRepo,
      proposalRepo,
      optionRepo,
      whatsapp,
      audit,
    );

    const result = await service.proposeSchedule("m1", { id: "p1" } as any, [
      { kind: ScheduleOptionKind.EXACT, label: "2026-04-10 19:00", startAt: new Date() },
    ]);

    expect(result.ok).toBe(true);
  });
});
