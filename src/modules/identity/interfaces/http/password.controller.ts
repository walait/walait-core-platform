import { JwtAuthGuard } from "@/modules/identity/interfaces/guards/jwt.guard";
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ZodValidationPipe } from "nestjs-zod";
import { firstValueFrom } from "rxjs";
import { PasswordService } from "../../application/password.service";
import { TokenService } from "../../application/token.service";
import { UserService } from "../../application/user.service";
import { ConfigService } from "@nestjs/config";
import { IUserRequest } from "../../domain/user.interface";

@UsePipes(ZodValidationPipe)
@Controller("password")
export class PasswordController {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    @Inject("EVENT_BUS") private client: ClientProxy,
  ) {}

  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new NotFoundException("User not found");

    const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000);

    const token = await this.tokenService.generateToken(
      { user, expires_at: tokenExpiration },
      this.configService.get<string>("PASSWORD_RESET_SECRET") ?? "",
      "1h",
    );

    this.client.send("audit.password.reset_requested", {
      user_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      token,
      token_expiration_at: tokenExpiration,
      template_slug: "reset_password.es", // opcionalmente dinámico
    });

    return {
      message: "Password reset email sent successfully",
      user: this.userService.toResponse(user),
    };
  }
  @Post("reset-password")
  async resetPassword(
    @Query("token") token: string,
    @Body("password") password: string,
    @Req() req: { user: IUserRequest },
  ) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new NotFoundException("User not found");

    // Verifica el token consultando email-ms
    const resetToken = await firstValueFrom(
      this.client.send("email.getToken", {
        token,
        expected_user_id: user.id,
        context: "password_reset",
      }),
    );

    if (!resetToken) throw new NotFoundException("Invalid or expired token");

    // Cambia la contraseña
    const hashedPassword = await this.passwordService.hashPassword(password);
    user.password_hash = hashedPassword;
    user.updated_at = new Date();
    await this.userService.updateUser(user);

    // Elimina el token en email-ms
    await firstValueFrom(
      this.client.send("email.deleteToken", {
        token,
        user_id: user.id,
      }),
    );

    this.client.send("audit.password.reset_confirmed", {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return {
      message: "Password reset successfully",
      user: this.userService.toResponse(user),
    };
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: { user: IUserRequest },
    @Body("oldPassword") oldPassword: string,
    @Body("newPassword") newPassword: string,
  ) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new NotFoundException("User not found");

    const ok = await this.passwordService.checkPassword(
      user.password_hash,
      oldPassword,
    );
    if (!ok) throw new BadRequestException("Current password incorrect");

    user.password_hash = await this.passwordService.hashPassword(newPassword);
    user.updated_at = new Date();

    await this.userService.updateUser(user);

    this.client.send("audit.password.changed", {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return {
      message: "Password changed successfully",
      user: this.userService.toResponse(user),
    };
  }
}
