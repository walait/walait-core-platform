import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './application/session.service';
import { Session } from './domain/model/session.entity';
import { SessionController } from './interfaces/http/session.controller';
import { UserModule } from './user.module';

@Module({
  controllers: [SessionController],
  imports: [TypeOrmModule.forFeature([Session]), UserModule],
  exports: [SessionService],
  providers: [SessionService],
})
export class SessionModule {}
