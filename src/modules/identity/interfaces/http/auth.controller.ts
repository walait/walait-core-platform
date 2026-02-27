import { AuthService } from "@/modules/identity/application/auth.service";
import { JwtAuthGuard } from "@/modules/identity/interfaces/guards/jwt.guard";
import { ClientInfo } from "@/shared/decorators/clientInfo.decorator";
import {
  Body,
  Controller,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply, FastifyRequest } from "fastify";
import { ZodValidationPipe } from "nestjs-zod";
import { SignInInput, SignUpInput } from "../schemas/auth.schema";

@UsePipes(ZodValidationPipe)
@Controller("auth")
export class AuthController {
  private readonly refreshCookieName = "refresh_token";

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post("sign-in")
  async signIn(
    @Body() dto: SignInInput,
    @ClientInfo() clientInfo: { ipAddress: string; userAgent: string },
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const result = await this.authService.signIn(dto, clientInfo);

    response.setCookie(this.refreshCookieName, result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "PRODUCTION",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post("sign-up")
  signUp(
    @Body() dto: SignUpInput,
    @ClientInfo() clientInfo: { ipAddress: string; userAgent: string },
  ) {
    return this.authService.signUp(dto, clientInfo);
  }

  @Post("refresh-token")
  async refresh(
    @Req() req: FastifyRequest & { cookies?: { refresh_token?: string } },
  ) {
    const refreshToken = req.cookies?.[this.refreshCookieName];
    if (!refreshToken)
      throw new UnauthorizedException("No refresh token found");

    const accessToken = await this.authService.refreshToken({
      refresh_token: refreshToken,
    });

    return { accessToken };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(
    @Req() req: FastifyRequest & { user: { sid: string } },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    res.clearCookie(this.refreshCookieName, { path: "/" });
    return this.authService.logout(req.user.sid);
  }
}
