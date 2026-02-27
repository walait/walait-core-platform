import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from './application/password.service';
import { PasswordResetToken } from './domain/model/password-reset-token.entity';
import { PasswordController } from './interfaces/http/password.controller';
import { UserModule } from './user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordResetToken]), UserModule],
  controllers: [PasswordController],
  exports: [PasswordService],
  providers: [PasswordService],
})
export class PasswordModule {}
