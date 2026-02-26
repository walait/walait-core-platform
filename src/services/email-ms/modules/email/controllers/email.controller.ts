import { Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { EmailService } from '../services/email.service';

@UsePipes(ZodValidationPipe)
@Controller('email-ms')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('syncronize')
  async syncronizeTemplate() {
    return await this.emailService.syncTemplates();
  }
}
