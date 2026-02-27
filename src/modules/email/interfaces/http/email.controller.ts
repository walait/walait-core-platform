import { Controller, Inject, Post, UsePipes } from "@nestjs/common";

import { EmailService } from "../../application/email.service";
import { ZodValidationPipe } from "nestjs-zod";

@UsePipes(ZodValidationPipe)
@Controller("email-ms")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("syncronize")
  async syncronizeTemplate() {
    return await this.emailService.syncTemplates();
  }
}
