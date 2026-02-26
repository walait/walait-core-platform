import { AccessModule } from '@/modules/access/access.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controller/user.controller';
import { User } from './model/user.entity';
import { UserService } from './services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AccessModule],
  controllers: [UserController],
  exports: [UserService],
  providers: [UserService],
})
export class UserModule {}
