import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from '../user/user.module';
import { PasswordModule } from '../password/password.module';
import { SessionModule } from '../session/session.module';
import { OrganizationModule } from '@/services/organization-ms/app.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [UserModule, SessionModule, OrganizationModule, PasswordModule, EventEmitterModule],
  controllers: [AuthController],
  exports: [],
  providers: [AuthService],
})
export class AuthModule {}
