import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EmailService } from '../modules/email/services/email.service';
import { VerificationService } from '../modules/verification/services/verification.service';
import { EmailVerificationToken } from '../modules/verification/model/email-verification-token.entity';

type GetTokenEvent = {
  token: string;
  expected_user_id: string;
  context: 'password_reset';
};

type DeleteTokenEvent = {
  token: string;
  user_id: string;
};

@Injectable()
export class EmailListener {
  constructor(
    private readonly emailService: EmailService,
    private readonly verificationService: VerificationService,
  ) {}

  @MessagePattern('email.getToken', { async: true })
  async handleGetToken(event: GetTokenEvent) {
    const { expected_user_id, token, context } = event;

    const tokenFound = await this.verificationService.findToken(token);

    this.validateToken(tokenFound, expected_user_id);

    return tokenFound;
  }

  @MessagePattern('email.deleteToken', { async: true })
  async handleDeleteToken(event: DeleteTokenEvent) {
    const { token, user_id } = event;
    const tokenFound = await this.verificationService.findToken(token);
    this.validateToken(tokenFound, user_id);

    await this.verificationService.deleteToken(tokenFound);
  }

  private validateToken(tokenFound: EmailVerificationToken, userId: string) {
    if (!tokenFound) {
      throw new NotFoundException('');
    }

    if (tokenFound.user_id !== userId) {
      throw new ForbiddenException("User don't matched");
    }
  }
}
