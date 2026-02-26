import { Module } from '@nestjs/common';
import { MemberService } from './modules/membership/services/member.service';
import { OrganizationService } from './modules/orgnanization/services/organization.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './modules/orgnanization/model/organization.entity';
import { Membership } from './modules/membership/model/membership.entity';
import { OrganizationRmqListener } from './listeners/organization.listener';
import { MembershipRmqListener } from './listeners/membership.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Membership])],
  providers: [MemberService, OrganizationService],
  controllers: [OrganizationRmqListener, MembershipRmqListener],
  exports: [MemberService, OrganizationService],
})
export class OrganizationModule {}
