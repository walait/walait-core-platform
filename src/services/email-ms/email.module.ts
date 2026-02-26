import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailEntity } from './modules/email/model/email.entity';
import { EmailVerificationToken } from './modules/verification/model/email-verification-token.entity';
import { SharedModule } from '@/shared/shared.module';
import { EmailController } from './modules/email/controllers/email.controller';
import { VerificationController } from './modules/verification/controllers/verification.controller';
import { EmailService } from './modules/email/services/email.service';
import { VerificationService } from './modules/verification/services/verification.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([EmailEntity, EmailVerificationToken])],
  controllers: [EmailController, VerificationController],
  exports: [EmailService, VerificationService],
  providers: [EmailService, VerificationService],
})
export class EmailModule {}
