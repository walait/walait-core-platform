import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './model/session.entity';
import { SessionController } from './controller/session.controller';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [SessionController],
  imports: [TypeOrmModule.forFeature([Session]), UserModule],
  exports: [SessionService],
  providers: [SessionService],
})
export class SessionModule {}
