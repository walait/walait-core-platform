import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberService } from './application/member.service';
import { OrganizationService } from './application/organization.service';
import { Membership } from './domain/model/membership.entity';
import { Organization } from './domain/model/organization.entity';
import { MembershipRmqListener } from './infrastructure/listeners/membership.listener';
import { OrganizationRmqListener } from './infrastructure/listeners/organization.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, Membership])],
  providers: [MemberService, OrganizationService],
  controllers: [OrganizationRmqListener, MembershipRmqListener],
  exports: [MemberService, OrganizationService],
})
export class OrganizationModule {}
