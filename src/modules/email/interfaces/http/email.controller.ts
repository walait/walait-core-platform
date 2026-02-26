import { Controller, Inject, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { EmailService } from '../../application/email.service';

@UsePipes(ZodValidationPipe)
@Controller('email-ms')
export class EmailController {
  constructor(@Inject(EmailService) private readonly emailService: EmailService) {}

  @Post('syncronize')
  async syncronizeTemplate() {
    return await this.emailService.syncTemplates();
  }
}
