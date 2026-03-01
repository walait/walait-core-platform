import { vi } from "vitest";

export const createRepositoryMock = <T>() => ({
  findOne: vi.fn(),
  find: vi.fn(),
  findBy: vi.fn(),
  save: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  create: vi.fn((value: Partial<T>) => value),
});
