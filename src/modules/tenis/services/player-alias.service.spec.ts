import { describe, expect, it, vi } from "vitest";
import { PlayerAliasService } from "./player-alias.service";

describe("PlayerAliasService", () => {
  it("rejects when limit reached", async () => {
    const repo = {
      findOne: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(3),
      create: vi.fn(),
      save: vi.fn(),
    } as any;
    const service = new PlayerAliasService(repo);

    const result = await service.addAlias("p1", "mi apodo");
    expect(result.ok).toBe(false);
  });

  it("reactivates alias", async () => {
    const repo = {
      findOne: vi.fn().mockResolvedValue({
        id: "a1",
        is_active: false,
        alias: "old",
        alias_normalized: "old",
      }),
      count: vi.fn().mockResolvedValue(0),
      save: vi.fn().mockImplementation(async (v) => v),
    } as any;
    const service = new PlayerAliasService(repo);

    const result = await service.addAlias("p1", "nuevo");
    expect(result.ok).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });
});
