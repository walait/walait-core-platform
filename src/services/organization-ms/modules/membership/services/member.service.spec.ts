import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { type Mock, vi } from 'vitest';
import { Membership } from '../model/membership.entity';
import { MemberService } from './member.service';

// Utilidad para crear mocks de repositorio TypeORM
const createMockRepo = <T = unknown>(): Partial<Record<keyof Repository<T>, Mock>> => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('MemberService', () => {
  let service: MemberService;
  let repo: Partial<Record<keyof Repository<Membership>, Mock>>;

  const mockMembership: Membership = {
    id: 'mem-1',
    user_id: 'user-1',
    organization: { id: 'org-1' } as unknown as Membership['organization'],
  } as Membership;

  beforeEach(async () => {
    repo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: getRepositoryToken(Membership),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get(MemberService);
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('returns membership by id', async () => {
      (repo.findOne as Mock).mockResolvedValue(mockMembership);
      const result = await service.findById('mem-1');
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'mem-1' } });
      expect(result).toEqual(mockMembership);
    });
  });

  describe('findByUserId', () => {
    it('returns memberships for user', async () => {
      (repo.find as Mock).mockResolvedValue([mockMembership]);
      const result = await service.findByUserId('user-1');
      expect(repo.find).toHaveBeenCalledWith({ where: { user_id: 'user-1' } });
      expect(result).toEqual([mockMembership]);
    });
  });

  describe('createMembership', () => {
    it('creates membership', async () => {
      (repo.create as Mock).mockReturnValue(mockMembership);
      (repo.save as Mock).mockResolvedValue(mockMembership);
      const result = await service.createMembership(mockMembership);
      expect(repo.create).toHaveBeenCalledWith(mockMembership);
      expect(repo.save).toHaveBeenCalledWith(mockMembership);
      expect(result).toEqual(mockMembership);
    });
  });

  describe('updateMembership', () => {
    it('updates membership and returns updated entity', async () => {
      (repo.update as Mock).mockResolvedValue(undefined);
      (repo.findOne as Mock).mockResolvedValue(mockMembership);
      const result = await service.updateMembership('mem-1', { user_id: 'asdf-123' });
      expect(repo.update).toHaveBeenCalledWith('mem-1', { user_id: 'asdf-123' });
      expect(result).toEqual(mockMembership);
    });
  });

  describe('deleteMembership', () => {
    it('deletes membership', async () => {
      (repo.delete as Mock).mockResolvedValue(undefined);
      await service.deleteMembership('mem-1');
      expect(repo.delete).toHaveBeenCalledWith('mem-1');
    });
  });

  describe('getMembershipAndOrg', () => {
    it('returns membership with org relation', async () => {
      (repo.findOne as Mock).mockResolvedValue(mockMembership);
      const result = await service.getMembershipAndOrg('user-1');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        relations: ['organization'],
      });
      expect(result).toEqual(mockMembership);
    });

    it('throws NotFoundException if not found', async () => {
      (repo.findOne as Mock).mockResolvedValue(null);
      await expect(service.getMembershipAndOrg('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMembershipsByOrganizationId', () => {
    it('returns memberships by org id', async () => {
      (repo.find as Mock).mockResolvedValue([mockMembership]);
      const result = await service.getMembershipsByOrganizationId('org-1');
      expect(repo.find).toHaveBeenCalledWith({ where: { organization: { id: 'org-1' } } });
      expect(result).toEqual([mockMembership]);
    });
  });
});
