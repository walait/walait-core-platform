import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { SessionModule } from './modules/session/session.module';
import { PasswordModule } from './modules/password/password.module';
import { UserModule } from './modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenModule } from './modules/token/token.module';
import { EmailModule } from '../email-ms/email.module';
import { UserRqmListener } from './listeners/user.listener';
import { SessionRmqListener } from './listeners/session.listener';

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
