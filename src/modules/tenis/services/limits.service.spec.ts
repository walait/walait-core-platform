import { describe, expect, it } from "vitest";
import { createRepositoryMock } from "../testing/repo";
import { LimitsService } from "./limits.service";

describe("LimitsService", () => {
  it("calculates current period", () => {
    const repo = createRepositoryMock<any>();
    const service = new LimitsService(repo as any);
    const period = service.getCurrentPeriod(new Date("2026-04-15T00:00:00Z"));
    expect(period).toBe(202604);
  });

  it("does not block when sent_count is 1", async () => {
    const repo = createRepositoryMock<any>();
    repo.findOne.mockResolvedValue({ sent_count: 1, accepted_count: 0 });
    const service = new LimitsService(repo as any);
    const canSend = await service.canSendChallenge("p1", 202604);
    expect(canSend).toBe(true);
  });
});
