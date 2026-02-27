import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { vi } from "vitest";
import { PasswordService } from "../../application/password.service";
import { TokenService } from "../../application/token.service";
import { UserService } from "../../application/user.service";
import { JwtAuthGuard } from "../guards/jwt.guard";
import { PasswordController } from "./password.controller";

describe("PasswordController", () => {
  let controller: PasswordController;

  const user = {
    id: "user-1",
    email: "test@example.com",
    password_hash: "hashed",
    updated_at: new Date(),
    is_email_verified: true,
  };

  const userService = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    updateUser: vi.fn(),
    toResponse: vi.fn().mockReturnValue({ id: user.id }),
  };

  const tokenService = {
    generateToken: vi.fn(),
  };

  const eventBus = {
    send: vi.fn(),
  };

  const configService = {
    get: vi.fn().mockImplementation((key: string) => {
      if (key === "PASSWORD_RESET_SECRET") return "password-reset-secret";
      return undefined;
    }),
  };

  const passwordService = {
    hashPassword: vi.fn(),
    checkPassword: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PasswordController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: TokenService, useValue: tokenService },
        { provide: PasswordService, useValue: passwordService },
        { provide: ConfigService, useValue: configService },
        { provide: "EVENT_BUS", useValue: eventBus },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(PasswordController);
    vi.clearAllMocks();
  });

  describe("forgotPassword", () => {
    it("should send reset token if user exists", async () => {
      userService.findByEmail.mockResolvedValue(user);
      tokenService.generateToken.mockResolvedValue("reset-token");
      const result = await controller.forgotPassword(user.email);

      expect(tokenService.generateToken).toHaveBeenCalledWith(
        { user, expires_at: expect.any(Date) },
        "password-reset-secret",
        "1h",
      );
      expect(eventBus.send).toHaveBeenCalledWith(
        "audit.password.reset_requested",
        expect.objectContaining({
          user_id: user.id,
          email: user.email,
          token: "reset-token",
        }),
      );
      expect(result).toEqual({
        message: "Password reset email sent successfully",
        user: { id: user.id },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      userService.findByEmail.mockResolvedValue(null);
      await expect(
        controller.forgotPassword("invalid@example.com"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("resetPassword", () => {
    const req = {
      user: {
        sub: user.id,
        sid: "session-1",
        email: user.email,
        organization_id: "org-1",
        role: "member" as const,
      },
    };

    it("should reset password if token is valid", async () => {
      userService.findById.mockResolvedValue(user);
      eventBus.send
        .mockReturnValueOnce(of({ token: "reset-token" }))
        .mockReturnValueOnce(of(true));
      passwordService.hashPassword.mockResolvedValue("newhash");
      userService.updateUser.mockResolvedValue({
        ...user,
        password_hash: "newhash",
      });

      const result = await controller.resetPassword(
        "valid-token",
        "new-password",
        req,
      );

      expect(eventBus.send).toHaveBeenCalledWith("email.getToken", {
        token: "valid-token",
        expected_user_id: user.id,
        context: "password_reset",
      });
      expect(eventBus.send).toHaveBeenCalledWith("email.deleteToken", {
        token: "valid-token",
        user_id: user.id,
      });
      expect(result).toEqual({
        message: "Password reset successfully",
        user: { id: user.id },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      userService.findById.mockResolvedValue(null);
      await expect(
        controller.resetPassword("token", "pass", req),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if token is invalid", async () => {
      userService.findById.mockResolvedValue(user);
      eventBus.send.mockReturnValueOnce(of(null));
      await expect(
        controller.resetPassword("invalid-token", "pass", req),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if token is expired", async () => {
      userService.findById.mockResolvedValue(user);
      eventBus.send.mockReturnValueOnce(of(null));
      await expect(
        controller.resetPassword("expired-token", "pass", req),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("changePassword", () => {
    const req = {
      user: {
        sub: user.id,
        sid: "session-1",
        email: user.email,
        organization_id: "org-1",
        role: "member" as const,
      },
    };

    it("should change password if current one is correct", async () => {
      userService.findById.mockResolvedValue(user);
      passwordService.checkPassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue("newhash");
      userService.updateUser.mockResolvedValue({
        ...user,
        password_hash: "newhash",
      });

      const result = await controller.changePassword(
        req,
        "old-password",
        "new-password",
      );

      expect(result).toEqual({
        message: "Password changed successfully",
        user: { id: user.id },
      });
    });

    it("should throw NotFoundException if user not found", async () => {
      userService.findById.mockResolvedValue(null);
      await expect(
        controller.changePassword(req, "old", "new"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequest if old password is incorrect", async () => {
      userService.findById.mockResolvedValue(user);
      passwordService.checkPassword.mockResolvedValue(false);
      await expect(
        controller.changePassword(req, "wrong-old", "new"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
