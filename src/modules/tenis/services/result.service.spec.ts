import { describe, expect, it, vi } from "vitest";
import { MatchStatus, ResultReportStatus } from "../tenis.enums";
import { ResultService } from "./result.service";

describe("ResultService", () => {
  it("rejects invalid score", async () => {
    const reportRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any;
    const matchRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: "m1",
        status: MatchStatus.SCHEDULED,
        challenge_id: "c1",
      }),
      save: vi.fn(),
    } as any;
    const challengeRepo = {} as any;
    const disputeRepo = { create: vi.fn(), save: vi.fn() } as any;
    const playerRepo = { findOne: vi.fn() } as any;
    const ranking = { applyMatchPoints: vi.fn() } as any;
    const whatsapp = { sendResultConfirmation: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ResultService(
      reportRepo,
      matchRepo,
      challengeRepo,
      disputeRepo,
      playerRepo,
      ranking,
      whatsapp,
      audit,
    );

    const result = await service.reportResult("m1", { id: "p1" } as any, "bad");
    expect(result.ok).toBe(false);
  });

  it("confirms pending result", async () => {
    const reportRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: "r1",
        match_id: "m1",
        status: ResultReportStatus.PENDING_CONFIRMATION,
        reported_by_player_id: "p1",
      }),
      save: vi.fn((v) => v),
    } as any;
    const matchRepo = {
      findOne: vi.fn().mockResolvedValue({ id: "m1", challenge_id: "c1" }),
      save: vi.fn(),
    } as any;
    const challengeRepo = {
      findOne: vi.fn().mockResolvedValue({
        challenger_rank_at_create: 1,
        challenged_rank_at_create: 5,
      }),
    } as any;
    const disputeRepo = {} as any;
    const playerRepo = { findOne: vi.fn() } as any;
    const ranking = { applyMatchPoints: vi.fn() } as any;
    const whatsapp = { sendResultConfirmation: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ResultService(
      reportRepo,
      matchRepo,
      challengeRepo,
      disputeRepo,
      playerRepo,
      ranking,
      whatsapp,
      audit,
    );

    const result = await service.confirmResult("r1", { id: "p2", phone_e164: "2" } as any);
    expect(result.ok).toBe(true);
    expect(ranking.applyMatchPoints).toHaveBeenCalled();
  });
});
