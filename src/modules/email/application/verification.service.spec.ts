import { User } from "@/modules/identity/domain/model/user.entity";
import { NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { LessThan, type Repository } from "typeorm";
import { type Mock, vi } from "vitest";
import { EmailVerificationToken } from "../domain/model/email-verification-token.entity";
import { VerificationService } from "./verification.service";

describe("EmailVerificationService", () => {
  let service: VerificationService;
  let repo: { [K in keyof Repository<EmailVerificationToken>]: Mock };

  const mockUser = { id: "user-1" } as User;

  const mockToken: EmailVerificationToken = {
    id: "token-1",
    token: "abc123",
    user_id: "user-id",
    used_at: null,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 10000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: getRepositoryToken(EmailVerificationToken),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            findOne: vi.fn(),
            delete: vi.fn(),
            find: vi.fn(),
            clear: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(VerificationService);
    repo = module.get(getRepositoryToken(EmailVerificationToken));
  });

  afterEach(() => vi.clearAllMocks());

  describe("createToken", () => {
    it("should create and save a new token", async () => {
      repo.create.mockReturnValue(mockToken);
      repo.save.mockResolvedValue(mockToken);

      const result = await service.createToken(
        mockUser.id,
        "abc123",
        mockToken.expires_at,
      );

      expect(repo.create).toHaveBeenCalledWith({
        user_id: mockUser.id,
        token: "abc123",
        expires_at: mockToken.expires_at,
      });
      expect(repo.save).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockToken);
    });
  });

  describe("findToken", () => {
    it("should return a token with user relation", async () => {
      repo.findOne.mockResolvedValue(mockToken);

      const result = await service.findToken("abc123");
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { token: "abc123" },
        relations: ["user"],
      });
      expect(result).toEqual(mockToken);
    });
  });

  describe("deleteToken", () => {
    it("should delete a token by ID", async () => {
      await service.deleteToken(mockToken);
      expect(repo.delete).toHaveBeenCalledWith({ id: mockToken.id });
    });
  });

  describe("deleteTokensByUserId", () => {
    it("should delete all tokens for a user", async () => {
      await service.deleteTokensByUserId(mockUser.id);
      expect(repo.delete).toHaveBeenCalledWith({ user_id: mockUser.id });
    });
  });

  describe("findTokensByUserId", () => {
    it("should return all tokens for a user", async () => {
      repo.find.mockResolvedValue([mockToken]);

      const result = await service.findTokensByUserId(mockUser.id);
      expect(repo.find).toHaveBeenCalledWith({
        where: { user_id: mockUser.id },
        relations: ["user"],
      });
      expect(result).toEqual([mockToken]);
    });
  });

  describe("deleteExpiredTokens", () => {
    it("should delete all expired tokens", async () => {
      const now = new Date("2026-02-26T00:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);
      await service.deleteExpiredTokens();
      expect(repo.delete).toHaveBeenCalledWith({ expires_at: LessThan(now) });
      vi.useRealTimers();
    });
  });

  describe("deleteAllTokens", () => {
    it("should clear the token table", async () => {
      await service.deleteAllTokens();
      expect(repo.clear).toHaveBeenCalled();
    });
  });

  describe("getEmailVerificationToken", () => {
    it("should return the token if valid", async () => {
      repo.findOne.mockResolvedValue(mockToken);

      const result = await service.getEmailVerificationToken("abc123");
      expect(result).toEqual({ token: mockToken });
    });

    it("should throw NotFoundException if token not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.getEmailVerificationToken("invalid"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should delete and throw if token is expired", async () => {
      const expiredToken = {
        ...mockToken,
        expires_at: new Date(Date.now() - 1000),
      };
      repo.findOne.mockResolvedValue(expiredToken);

      await expect(
        service.getEmailVerificationToken("expired"),
      ).rejects.toThrow(NotFoundException);
      expect(repo.delete).toHaveBeenCalledWith({ id: expiredToken.id });
    });
  });

  describe("createVerificationTokenEmail", () => {
    it("should call createToken with user data", async () => {
      const spy = vi.spyOn(service, "createToken").mockResolvedValue(mockToken);

      const result = await service.createToken(
        mockUser.id,
        "abc123",
        mockToken.expires_at,
      );
      expect(spy).toHaveBeenCalledWith(
        mockUser.id,
        "abc123",
        mockToken.expires_at,
      );
      expect(result).toEqual(mockToken);
    });
  });
});
