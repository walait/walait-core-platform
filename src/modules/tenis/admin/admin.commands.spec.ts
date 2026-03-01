import { describe, expect, it, vi } from "vitest";
import { AdminCommands } from "./admin.commands";

describe("AdminCommands", () => {
  it("validates walkover format", async () => {
    const matchRepo = {} as any;
    const playerRepo = { findOne: vi.fn().mockResolvedValue(null) } as any;
    const resultService = { applyWalkover: vi.fn() } as any;
    const exportJob = { runNow: vi.fn() } as any;

    const commands = new AdminCommands(matchRepo, playerRepo, resultService, exportJob);

    const result = await commands.execute("/walkover", "5491");
    expect(result.ok).toBe(false);
  });
});
