import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from '@/services/identity-ms/modules/auth/services/auth.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { ClientInfo } from '@/shared/decorators/clientInfo.decorator';

import { ConfigService } from '@nestjs/config';
import {
  SignInInput,
  SignUpSchema,
  SignUpInput,
  SignUpDTO,
  SignInDTO,
} from '../schemas/auth.schema';
import { JwtAuthGuard } from '@/services/identity-ms/guards/jwt.guard';
import { Response, Request } from 'express';
import { SignInSchema } from '../schemas/auth.schema';

@UsePipes(ZodValidationPipe)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
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
    const refreshToken = req.cookies?.['refresh_token'];
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
