import { Module } from '@nestjs/common';
import { PermissionService } from './modules/permission/services/permission.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './modules/user-roles/model/user-role.entity';
import { Role } from './modules/role/model/role.entity';
import { Permission } from './modules/permission/model/permission.entity';
import { RolePermission } from './modules/role-permission/model/role-permission.entity';
import { APP_GUARD } from '@nestjs/core/constants';
import { PermissionsGuard } from './modules/permission/guards/permission.guard';
import { UserRoleService } from './modules/user-roles/services/user-role.service';
import { RoleService } from './modules/role/services/role.service';
import { AccessService } from './services/access.service';
import { RolesGuard } from './modules/role/guards/role.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserRolesRmqListener } from './listeners/user-roles.listener';
import { PermissionRmqListener } from './listeners/permissions.listener';

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
