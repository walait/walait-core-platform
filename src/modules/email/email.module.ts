import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './application/email.service';
import { VerificationService } from './application/verification.service';
import { EmailVerificationToken } from './domain/model/email-verification-token.entity';
import { EmailEntity } from './domain/model/email.entity';
import { EmailController } from './interfaces/http/email.controller';
import { VerificationController } from './interfaces/http/verification.controller';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([EmailEntity, EmailVerificationToken])],
  controllers: [EmailController, VerificationController],
  exports: [EmailService, VerificationService],
  providers: [EmailService, VerificationService],
})
export class EmailModule {}
