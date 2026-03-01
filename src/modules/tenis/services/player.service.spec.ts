import { describe, expect, it, vi } from "vitest";
import { createRepositoryMock } from "../testing/repo";
import { PlayerService } from "./player.service";

describe("PlayerService", () => {
  it("returns existing player", async () => {
    const repo = createRepositoryMock<any>();
    repo.findOne.mockResolvedValue({ id: "p1", phone_e164: "5491" });
    const service = new PlayerService(repo as any);

    const result = await service.ensurePlayer("5491", "Nombre");

    expect(result.created).toBe(false);
    expect(result.player.id).toBe("p1");
  });

  it("creates new player", async () => {
    const repo = createRepositoryMock<any>();
    repo.findOne.mockResolvedValue(null);
    repo.save.mockImplementation(async (value) => value);
    const service = new PlayerService(repo as any);

    const result = await service.ensurePlayer("5491", "Nombre");

    expect(result.created).toBe(true);
    expect(result.player.phone_e164).toBe("5491");
    expect(repo.save).toHaveBeenCalled();
  });
});
