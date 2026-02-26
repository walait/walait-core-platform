import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Organization } from '../model/organization.entity';
import { Repository } from 'typeorm';
import { OrganizationType } from '../schemas/organization.schema';
@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}
  async createOrganization(data: OrganizationType): Promise<Organization> {
    const exists = await this.organizationRepository.findOne({
      where: [{ domain: data.domain }, { slug: data.slug }],
    });

    if (exists) {
      throw new ConflictException('Domain already in use');
    }
    const organization = this.organizationRepository.create(data);
    return this.organizationRepository.save(organization);
  }

  async updateOrganization(data: OrganizationType): Promise<Organization> {
    const exists = await this.organizationRepository.findOne({
      where: [{ domain: data.domain }, { slug: data.slug }],
    });

    if (exists) {
      throw new ConflictException('Domain already in use');
    }

    const organization = await this.getOrganizationById(data.id);
    Object.assign(organization, data);
    return this.organizationRepository.save(organization);
  }
  async getOrganizationById(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async deleteOrganization(id: string): Promise<void> {
    const organization = await this.getOrganizationById(id);
    await this.organizationRepository.remove(organization);
  }
  async getAllOrganizations(): Promise<Organization[]> {
    return this.organizationRepository.find();
  }
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { domain },
    });
  }
}
