import { User } from "@/modules/identity/domain/model/user.entity";
import { Test, type TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";
import { type Mock, vi } from "vitest";
import { UserService } from "./user.service";

vi.mock("argon2", () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

type MockRepo<T = unknown> = Partial<Record<keyof Repository<T>, Mock>>;

const createMockRepo = <T = unknown>(): MockRepo<T> => ({
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  findOneByOrFail: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
});

describe("UserService", () => {
  let service: UserService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    repo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it("should find user by id", async () => {
    const user = { id: "123" };
    (repo.findOne as Mock).mockResolvedValue(user);
    const result = await service.findById("123");
    expect(result).toBe(user);
  });

  it("should find user by email with password", async () => {
    const user = { id: "123", email: "test@test.com", password_hash: "hash" };
    (repo.findOne as Mock).mockResolvedValue(user);
    const result = await service.findByEmail("test@test.com", true);
    expect(result).toBe(user);
  });

  it("should return true if email exists", async () => {
    (repo.findOne as Mock).mockResolvedValue({ id: "x" });
    const exists = await service.existsByEmail("x@test.com");
    expect(exists).toBe(true);
  });

  it("should map user to response object", () => {
    const user = {
      id: "1",
      email: "email@test.com",
      first_name: "Test",
      last_name: "User",
      avatar_url: "url",
      metadata: {},
    } as User;
    const result = service.toResponse(user);
    expect(result).toEqual(
      expect.objectContaining({ id: "1", email: "email@test.com" }),
    );
  });

  it("should create user and hash password", async () => {
    const input = {
      email: "e",
      password: "p",
      first_name: "n",
      last_name: "b",
      metadata: {},
      avatar_url: "",
    } as Partial<User> & { password: string };
    (argon2.hash as Mock).mockResolvedValue("hashed");
    (repo.create as Mock).mockReturnValue({
      ...input,
      password_hash: "hashed",
    });
    (repo.save as Mock).mockResolvedValue({
      id: "1",
      ...input,
      password_hash: "hashed",
    });

    const result = await service.createUser(input);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ password_hash: "hashed" }),
    );
    expect(result).toEqual(expect.objectContaining({ id: "1" }));
  });

  it("should update user fields", async () => {
    const user = {
      id: "1",
      first_name: "Test",
      last_name: "User",
      avatar_url: "y",
      metadata: {},
      is_email_verified: true,
    } as User;
    (repo.findOneByOrFail as Mock).mockResolvedValue({ ...user });
    (repo.save as Mock).mockResolvedValue(user);

    const result = await service.updateUser(user);
    expect(result).toBe(user);
  });

  it("should delete user logically", async () => {
    const user = { id: "1", email: "x@test.com" } as User;
    (repo.findOneBy as Mock).mockResolvedValue(user);
    (repo.save as Mock).mockResolvedValue({});

    const result = await service.deleteUser("1");
    expect(result).toEqual({ message: "User deleted successfully" });
  });

  it("should throw if user not found on delete", async () => {
    (repo.findOneBy as Mock).mockResolvedValue(null);
    await expect(service.deleteUser("bad-id")).rejects.toThrow(
      "User not found",
    );
  });
});
