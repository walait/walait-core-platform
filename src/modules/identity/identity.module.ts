import { EmailModule } from '@/modules/email/email.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { SessionRmqListener } from './infrastructure/listeners/session.listener';
import { UserRqmListener } from './infrastructure/listeners/user.listener';
import { PasswordModule } from './password.module';
import { SessionModule } from './session.module';
import { TokenModule } from './token.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    SessionModule,
    PasswordModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    TokenModule,
  ],
  controllers: [UserRqmListener, SessionRmqListener],
  exports: [UserModule, SessionModule],
})
export class IdentityModule {}
