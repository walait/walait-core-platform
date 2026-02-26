import { Module } from '@nestjs/common';
import { PasswordController } from './controller/password.controller';
import { PasswordService } from './services/password.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordResetToken } from './model/password-reset-token.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([PasswordResetToken]), UserModule],
  controllers: [PasswordController],
  exports: [PasswordService],
  providers: [PasswordService],
})
export class PasswordModule {}
