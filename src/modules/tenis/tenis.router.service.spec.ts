import { describe, expect, it, vi } from "vitest";
import { TenisRouterService } from "./tenis.router.service";
import { createRepositoryMock } from "./testing/repo";

describe("TenisRouterService", () => {
  it("sends help on /ayuda", async () => {
    const stateRepo = createRepositoryMock<any>();
    const playerRepo = createRepositoryMock<any>();
    const roleRepo = createRepositoryMock<any>();
    const matchRepo = createRepositoryMock<any>();
    const challengeRepo = createRepositoryMock<any>();
    const challengeService = { createChallenge: vi.fn() } as any;
    const scheduleService = { proposeSchedule: vi.fn(), selectOption: vi.fn() } as any;
    const resultService = {
      reportResult: vi.fn(),
      confirmResult: vi.fn(),
      rejectResult: vi.fn(),
    } as any;
    const rankingService = { getRankingList: vi.fn().mockResolvedValue([]) } as any;
    const matchService = { getMatchByChallengeId: vi.fn() } as any;
    const whatsapp = { sendTextMessage: vi.fn() } as any;
    const adminCommands = { execute: vi.fn() } as any;

    const router = new TenisRouterService(
      stateRepo as any,
      playerRepo as any,
      roleRepo as any,
      matchRepo as any,
      challengeRepo as any,
      challengeService,
      scheduleService,
      resultService,
      rankingService,
      matchService,
      whatsapp,
      adminCommands,
    );

    await router.route({ id: "p1", phone_e164: "5491" } as any, {
      kind: "incoming_message",
      occurredAt: new Date().toISOString(),
      fromWaId: "5491",
      messageType: "text",
      text: "/ayuda",
      raw: {},
    });

    expect(whatsapp.sendTextMessage).toHaveBeenCalled();
  });
});
