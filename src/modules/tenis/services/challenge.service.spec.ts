import { describe, expect, it, vi } from "vitest";
import { ChallengeStatus } from "../tenis.enums";
import { ChallengeService } from "./challenge.service";

describe("ChallengeService", () => {
  it("blocks if rank diff > 10", async () => {
    const repo = { create: vi.fn((v) => v), save: vi.fn(), findOne: vi.fn() } as any;
    const limits = {
      getCurrentPeriod: vi.fn(() => 202604),
      canSendChallenge: vi.fn(() => true),
      incrementSent: vi.fn(),
      canAcceptChallenge: vi.fn(),
      incrementAccepted: vi.fn(),
    } as any;
    const ranking = {
      getRankPosition: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(20),
    } as any;
    const match = { createMatch: vi.fn() } as any;
    const jobs = { scheduleExpire: vi.fn() } as any;
    const whatsapp = { sendChallengeRequest: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ChallengeService(repo, limits, ranking, match, jobs, whatsapp, audit);

    const result = await service.createChallenge(
      { id: "p1", phone_e164: "1", display_name: "A" } as any,
      { id: "p2", phone_e164: "2", display_name: "B" } as any,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("diferencia");
  });

  it("accepts pending challenge", async () => {
    const repo = {
      create: vi.fn((v) => v),
      save: vi.fn((v) => v),
      findOne: vi.fn().mockResolvedValue({
        id: "c1",
        challenger_id: "p1",
        challenged_id: "p2",
        status: ChallengeStatus.PENDING,
      }),
    } as any;
    const limits = {
      getCurrentPeriod: vi.fn(() => 202604),
      canAcceptChallenge: vi.fn(() => true),
      incrementAccepted: vi.fn(),
      canSendChallenge: vi.fn(),
      incrementSent: vi.fn(),
    } as any;
    const ranking = {
      getRankPosition: vi.fn().mockResolvedValue(5),
    } as any;
    const match = { createMatch: vi.fn().mockResolvedValue({ id: "m1" }) } as any;
    const jobs = { scheduleExpire: vi.fn() } as any;
    const whatsapp = { sendChallengeRequest: vi.fn() } as any;
    const audit = { log: vi.fn() } as any;

    const service = new ChallengeService(repo, limits, ranking, match, jobs, whatsapp, audit);

    const result = await service.acceptChallenge("c1", { id: "p2", phone_e164: "2" } as any);
    expect(result.ok).toBe(true);
  });
});
