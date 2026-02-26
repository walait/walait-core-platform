import { AuthService } from '@/modules/identity/application/auth.service';
import { JwtAuthGuard } from '@/modules/identity/interfaces/guards/jwt.guard';
import { ClientInfo } from '@/shared/decorators/clientInfo.decorator';
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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import type { SignInInput, SignUpInput } from '../schemas/auth.schema';

@UsePipes(ZodValidationPipe)
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  @Post('sign-in')
  async signIn(
    @Body() dto: SignInInput,
    @ClientInfo() clientInfo: { ipAddress: string; userAgent: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(dto, clientInfo);

    response.cookie('refresh_token', result.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'PRODUCTION',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return response.status(200).send(result);
  }

  @Post('sign-up')
  signUp(
    @Body() dto: SignUpInput,
    @ClientInfo() clientInfo: { ipAddress: string; userAgent: string },
  ) {
    return this.authService.signUp(dto, clientInfo);
  }

  @Post('refresh-token')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token found');

    const accessToken = await this.authService.refreshToken(refreshToken);

    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
    return this.authService.logout(req.user.sid);
  }
}
