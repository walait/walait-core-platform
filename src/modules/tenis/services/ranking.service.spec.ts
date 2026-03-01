import { describe, expect, it } from "vitest";
import { createRepositoryMock } from "../testing/repo";
import { RankingService } from "./ranking.service";

describe("RankingService", () => {
  it("orders by points desc", async () => {
    const playerRepo = createRepositoryMock<any>();
    const statsRepo = createRepositoryMock<any>();

    playerRepo.find.mockResolvedValue([
      { id: "p1", is_active: true, display_name: "A" },
      { id: "p2", is_active: true, display_name: "B" },
    ]);
    statsRepo.find.mockResolvedValue([
      { player_id: "p1", points: 10, rank_position: null },
      { player_id: "p2", points: 20, rank_position: null },
    ]);
    statsRepo.save.mockImplementation(async (value) => value);
    const service = new RankingService(playerRepo as any, statsRepo as any);

    const ranking = await service.getRankingList(10);

    expect(ranking[0].playerId).toBe("p2");
    expect(ranking[1].playerId).toBe("p1");
  });
});
