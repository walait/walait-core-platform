import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { TokenService } from '@/modules/identity/application/token.service';
import { UserService } from '@/modules/identity/application/user.service';
import type { IUserRequest } from '@/modules/identity/domain/user.interface';
import { JwtAuthGuard } from '@/modules/identity/interfaces/guards/jwt.guard';
import { OrganizationService } from '@/services/organization-ms/modules/orgnanization/services/organization.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { string } from 'zod';
import { VerificationService } from '../../application/verification.service';
@Controller('email-verification-ms')
export class VerificationController {
  constructor(
    @Inject(VerificationService)
    private readonly vericationService: VerificationService,
    @Inject('EVENT_BUS') private client: ClientProxy,
  ) {}

  @Get('verify-email')
  @Redirect()
  async verifyEmail(
    @Query('token') emailToken: string,
    @Query('organization_id') organizationId: string,
  ) {
    const { token } = await this.vericationService.getEmailVerificationToken(emailToken);

    if (!token) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await firstValueFrom(
      this.client.send('user.getById', {
        user_id: token.user_id,
      }),
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.is_email_verified) {
      throw new BadRequestException('Email already verified');
    }

    user.is_email_verified = true;

    this.client.send('user.updateUser', {
      user,
    });

    const organization = await firstValueFrom(
      this.client.send('organizations.getOrganizationById', {
        organization_id: organizationId,
      }),
    );

    const domain = organization.domain.startsWith('http')
      ? (organization.domain ?? process.env.BACKED_URL)
      : `https://${organization.domain}`;

    return { url: domain, status: 3012 };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@Req() req: Request & { user: IUserRequest }) {
    const user = req.user;

    if (!user) throw new BadRequestException('User not found');

    const existingUser = await firstValueFrom(
      this.client.send('user.user.getById', {
        user_id: user.sub,
      }),
    );

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (existingUser.is_email_verified) {
      throw new BadRequestException('Email already verified');
    }

    const expirationAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    const token = await firstValueFrom(
      this.client.send('token.generateToken', {
        userId: existingUser.id,
        type: 'email_verification',
        expiration_at: Math.floor(Date.now() / 1000) + 60 * 60,
        secret: process.env.EMAIL_VERIFICATION_SECRET,
        expiration: '1h',
      }),
    );

    return await this.vericationService.createToken(existingUser.id, token, expirationAt);
  }
}
