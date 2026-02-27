import { Module } from '@nestjs/common';
import { AdminService } from './application/admin.service';
import { AdminController } from './interfaces/http/admin.controller';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
