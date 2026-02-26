import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, Repository } from 'typeorm';
import { Membership } from '../model/membership.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async findById(id: string): Promise<Membership | null> {
    return this.membershipRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    return this.membershipRepository.find({ where: { user_id: userId } });
  }

  async createMembership(data: Partial<Membership>): Promise<Membership> {
    const membership = this.membershipRepository.create(data);
    return this.membershipRepository.save(membership);
  }

  async updateMembership(id: string, data: Partial<Membership>): Promise<Membership> {
    await this.membershipRepository.update(id, data);
    return this.findById(id);
  }

  async deleteMembership(id: string): Promise<void> {
    await this.membershipRepository.delete(id);
  }

  async getMembershipAndOrg(userId: string) {
    const membership = await this.membershipRepository.findOne({
      where: { user_id: userId },
      relations: ['organization'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found for the user');
    }

    return membership;
  }
  async getMembershipsByOrganizationId(orgId: string): Promise<Membership[]> {
    return this.membershipRepository.find({ where: { organization: { id: orgId } } });
  }
}
