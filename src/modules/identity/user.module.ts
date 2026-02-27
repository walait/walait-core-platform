import { AccessModule } from '@/modules/access/access.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/user.service';
import { User } from './domain/model/user.entity';
import { UserController } from './interfaces/http/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AccessModule],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
