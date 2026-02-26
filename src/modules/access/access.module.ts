import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core/constants';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessService } from './application/access.service';
import { PermissionService } from './application/permission.service';
import { RoleService } from './application/role.service';
import { UserRoleService } from './application/user-role.service';
import { Permission } from './domain/model/permission.entity';
import { RolePermission } from './domain/model/role-permission.entity';
import { Role } from './domain/model/role.entity';
import { UserRole } from './domain/model/user-role.entity';
import { PermissionRmqListener } from './infrastructure/listeners/permissions.listener';
import { UserRolesRmqListener } from './infrastructure/listeners/user-roles.listener';
import { PermissionsGuard } from './interfaces/guards/permission.guard';
import { RolesGuard } from './interfaces/guards/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRole, Role, Permission, RolePermission]),
    EventEmitterModule,
  ],
  providers: [
    PermissionService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    UserRoleService,
    RoleService,
    AccessService,
  ],
  controllers: [UserRolesRmqListener, PermissionRmqListener],
  exports: [PermissionService, UserRoleService, RoleService, AccessService],
})
export class AccessModule {}
