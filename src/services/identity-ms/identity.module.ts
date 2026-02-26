import { EmailModule } from '@/modules/email/email.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionRmqListener } from './listeners/session.listener';
import { UserRqmListener } from './listeners/user.listener';
import { AuthModule } from './modules/auth/auth.module';
import { PasswordModule } from './modules/password/password.module';
import { SessionModule } from './modules/session/session.module';
import { TokenModule } from './modules/token/token.module';
import { UserModule } from './modules/user/user.module';

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
