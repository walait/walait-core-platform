import { OrganizationModule } from '@/modules/organization/organization.module';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthService } from './application/auth.service';
import { AuthController } from './interfaces/http/auth.controller';
import { PasswordModule } from './password.module';
import { SessionModule } from './session.module';
import { UserModule } from './user.module';

@Module({
  imports: [UserModule, SessionModule, OrganizationModule, PasswordModule, EventEmitterModule],
  controllers: [AuthController],
  exports: [],
  providers: [AuthService],
})
export class AuthModule {}
