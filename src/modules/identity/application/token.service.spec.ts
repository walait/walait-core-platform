import { JwtService } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import * as jsonwebtoken from "jsonwebtoken";
import { type Mock, vi } from "vitest";
import { TokenService } from "./token.service";

vi.mock("jsonwebtoken", () => ({
  decode: vi.fn(),
}));

describe("TokenService", () => {
  let service: TokenService;
  let jwtService: { signAsync: Mock; verifyAsync: Mock };

  beforeEach(async () => {
    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    } as { signAsync: Mock; verifyAsync: Mock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenService, { provide: JwtService, useValue: jwtService }],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it("should call signAsync with access token parameters", async () => {
    jwtService.signAsync.mockResolvedValue("access");
    const payload = { sub: "u1" };
    const token = await service.generateAccessToken(payload);

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        secret: process.env.JWT_SECRET ?? "",
        expiresIn: "15m",
      }),
    );
    expect(token).toBe("access");
  });

  it("should call signAsync with refresh token parameters", async () => {
    jwtService.signAsync.mockResolvedValue("refresh");
    const token = await service.generateRefreshToken({ sub: "u1" }, "secretX");

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ secret: "secretX", expiresIn: "7d" }),
    );
    expect(token).toBe("refresh");
  });

  it("should verify refresh token with custom secret", async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: "u1" });
    const result = await service.verifyRefreshToken("tok", "sec");
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("tok", {
      secret: "sec",
    });
    expect(result).toEqual({ sub: "u1" });
  });

  it("should verify access token with default secret", async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: "u1" });
    const result = await service.verifyAccessToken("tok");
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("tok", {
      secret: process.env.JWT_SECRET ?? "",
    });
    expect(result).toEqual({ sub: "u1" });
  });

  it("should decode payload", () => {
    (jsonwebtoken.decode as Mock).mockReturnValue({ foo: "bar" });
    const result = service.decodePayload("token123");
    expect(jsonwebtoken.decode).toHaveBeenCalledWith("token123");
    expect(result).toEqual({ foo: "bar" });
  });

  it("should generate a random session secret", () => {
    const secret = service.generateSessionSecret();
    expect(secret).toHaveLength(64); // 32 bytes hex => 64 chars
    // ensure hex string
    expect(secret).toMatch(/^[a-f0-9]{64}$/i);
    // uniqueness check (not deterministic, but minimal)
    const secret2 = service.generateSessionSecret();
    expect(secret2).not.toBe(secret);
  });
});
