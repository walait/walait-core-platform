import { Test, type TestingModule } from '@nestjs/testing';
import { hash, verify } from 'argon2';
import { type Mock, vi } from 'vitest';
import { PasswordService } from './password.service';

vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

describe('PasswordService', () => {
  let service: PasswordService;
  const previousSecret = process.env.HASH_PASSWORD_TOKEN;

  beforeEach(async () => {
    process.env.HASH_PASSWORD_TOKEN = 'test-secret';
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    process.env.HASH_PASSWORD_TOKEN = previousSecret;
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash the password using argon2.hash', async () => {
      const plain = 'super-secret';
      (hash as Mock).mockResolvedValue('hashed-value');

      const result = await service.hashPassword(plain);

      expect(hash).toHaveBeenCalledWith(plain);
      expect(result).toBe('hashed-value');
    });
  });

  describe('checkPassword', () => {
    it('should verify password without secret', async () => {
      (verify as Mock).mockResolvedValue(true);

      const ok = await service.checkPassword('hashed', 'plain');

      expect(verify).toHaveBeenCalledWith('hashed', 'plain');
      expect(ok).toBe(true);
    });

    it('should verify password with secret (pepper)', async () => {
      (verify as Mock).mockResolvedValue(true);

      await service.checkPassword('hashed', 'plain');

      expect(verify).toHaveBeenCalledWith('hashed', 'plain');
    });

    it('should return false when verification fails', async () => {
      (verify as Mock).mockResolvedValue(false);

      const ok = await service.checkPassword('hashed', 'wrong');

      expect(ok).toBe(false);
    });
  });
});
