import { AuthController } from "./interfaces/http/auth.controller";
import { AuthService } from "./application/auth.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Module } from "@nestjs/common";
import { OrganizationModule } from "@/modules/organization/organization.module";
import { PasswordModule } from "./password.module";
import { SessionModule } from "./session.module";
import { UserModule } from "./user.module";

@Module({
  imports: [
    UserModule,
    SessionModule,
    OrganizationModule,
    PasswordModule,
    EventEmitterModule,
  ],
  controllers: [AuthController],
  exports: [],
  providers: [AuthService],
})
export class AuthModule {}
