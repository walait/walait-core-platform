import { Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
// email-ms/listeners/email-verification.listener.ts
import { MessagePattern } from '@nestjs/microservices';
import type { EmailService } from '../../application/email.service';
import type { VerificationService } from '../../application/verification.service';

type EmailVerificatiMessagePattern = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization_slug: string;
  domain?: string;
  template_slug: string;
  token: string;
  token_expiration_at: Date;
};

type PasswordResetEvent = {
  user_id: string;
  token: string;
  new_password: string;
  requested_at: string;
};
type VerificationTokenEntity = {
  token: string;
};
@Injectable()
export class EmailVerificationListener {
  constructor(
    private readonly emailService: EmailService,
    private readonly verificationService: VerificationService,
    private readonly config: ConfigService,
  ) {}

  @MessagePattern('email.verification_requested', { async: true })
  async handleEmailVerificationRequested(event: EmailVerificatiMessagePattern) {
    const {
      user_id,
      email,
      first_name,
      last_name,
      organization_id,
      organization_slug,
      domain,
      template_slug,
      token_expiration_at,
      token,
    } = event;

    const verification = await this.verificationService.createToken(
      user_id,
      token,
      token_expiration_at,
    );
    if (!verification) throw new Error('Failed to generate token');

    const template = await this.emailService.getTemplateBySlug(template_slug);
    if (!template) throw new Error('Template not found');

    const baseUrl = this.config.get('EMAIL_VERIFICATION_URL');
    const verificationLink = `${baseUrl}?token=${verification.token}&organization_id=${organization_id}`;

    await this.emailService.sendEmailWithTemplate(template, email, 'Confirma tu cuenta', {
      firstName: first_name,
      lastName: last_name,
      verification_link: verificationLink,
      app_name: organization_slug ?? 'WalaTech',
    });
  }

  @MessagePattern('email.token.get', { async: true })
  async handleGetResetToken(event: {
    token: string;
    expected_user_id: string;
    context?: string;
  }): Promise<VerificationTokenEntity | null> {
    const token = await this.verificationService.findToken(event.token);

    if (!token || token.user_id !== event.expected_user_id || token.expires_at < new Date()) {
      return null;
    }

    return token;
  }

  @MessagePattern('email.token.delete', { async: true })
  async handleTokenDelete(event: { token: string; user_id: string }) {
    const token = await this.verificationService.findToken(event.token);
    if (token && token.user_id === event.user_id) {
      await this.verificationService.deleteToken(token);
    }
  }
}
