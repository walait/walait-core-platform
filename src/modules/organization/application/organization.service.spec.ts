import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "../domain/model/organization.entity";
import { OrganizationService } from "./organization.service";

describe("OrganizationService", () => {
  let service: OrganizationService;
  let repo: jest.Mocked<Repository<Organization>>;

  const organizationData = {
    id: "org-1",
    name: "Test Org",
    slug: "test-org",
    domain: "test.org",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(OrganizationService);
    repo = module.get(getRepositoryToken(Organization));
  });

  afterEach(() => jest.clearAllMocks());

  describe("createOrganization", () => {
    it("should create a new organization if not exists", async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(organizationData as Organization);
      repo.save.mockResolvedValue(organizationData as Organization);

      const result = await service.createOrganization(organizationData);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: [
          { domain: organizationData.domain },
          { slug: organizationData.slug },
        ],
      });
      expect(repo.create).toHaveBeenCalledWith(organizationData);
      expect(repo.save).toHaveBeenCalledWith(organizationData);
      expect(result).toEqual(organizationData);
    });

    it("should throw ConflictException if domain or slug already exists", async () => {
      repo.findOne.mockResolvedValue(organizationData as Organization);

      await expect(
        service.createOrganization(organizationData),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateOrganization", () => {
    it("should update an existing organization", async () => {
      repo.findOne
        .mockResolvedValueOnce(null) // no conflict
        .mockResolvedValueOnce(organizationData as Organization); // getOrganizationById

      repo.save.mockResolvedValue({
        ...organizationData,
        name: "Updated",
      } as Organization);

      const result = await service.updateOrganization(organizationData);

      expect(result.name).toBe("Updated");
      expect(repo.save).toHaveBeenCalled();
    });

    it("should throw ConflictException if domain or slug already exists", async () => {
      repo.findOne.mockResolvedValue(organizationData as Organization);

      await expect(
        service.updateOrganization(organizationData),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("getOrganizationById", () => {
    it("should return organization if found", async () => {
      repo.findOne.mockResolvedValue(organizationData as Organization);

      const result = await service.getOrganizationById("org-1");

      expect(result).toEqual(organizationData);
    });

    it("should throw NotFoundException if not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.getOrganizationById("org-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteOrganization", () => {
    it("should delete an organization if exists", async () => {
      repo.findOne.mockResolvedValue(organizationData as Organization);
      repo.remove.mockResolvedValue(undefined);

      await service.deleteOrganization("org-1");

      expect(repo.remove).toHaveBeenCalledWith(organizationData);
    });
  });

  describe("getAllOrganizations", () => {
    it("should return all organizations", async () => {
      const allOrgs = [organizationData];
      repo.find.mockResolvedValue(allOrgs as Organization[]);

      const result = await service.getAllOrganizations();

      expect(result).toEqual(allOrgs);
    });
  });

  describe("getOrganizationByDomain", () => {
    it("should return an organization by domain", async () => {
      repo.findOne.mockResolvedValue(organizationData as Organization);

      const result = await service.getOrganizationByDomain("test.org");

      expect(result).toEqual(organizationData);
    });

    it("should return null if not found", async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.getOrganizationByDomain("notfound.org");

      expect(result).toBeNull();
    });
  });
});
