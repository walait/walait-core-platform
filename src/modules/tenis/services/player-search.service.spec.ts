import { describe, expect, it, vi } from "vitest";
import { PlayerSearchService } from "./player-search.service";

describe("PlayerSearchService", () => {
  it("finds by phone", async () => {
    const playerRepo = {
      findOne: vi.fn().mockResolvedValue({ id: "p1", phone_e164: "5491112345678" }),
      find: vi.fn(),
    } as any;
    const aliasRepo = { find: vi.fn() } as any;
    const service = new PlayerSearchService(playerRepo, aliasRepo);

    const result = await service.searchOpponents("5491112345678", "p2");
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].id).toBe("p1");
  });

  it("finds by alias", async () => {
    const playerRepo = {
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([{ id: "p1", display_name: "Juan" }]),
    } as any;
    const aliasRepo = {
      find: vi.fn().mockResolvedValue([{ player_id: "p1" }]),
    } as any;
    const service = new PlayerSearchService(playerRepo, aliasRepo);

    const result = await service.searchOpponents("juan", "p2");
    expect(result.matches).toHaveLength(1);
  });
});
