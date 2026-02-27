import { Test, type TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { EmailService } from '../../application/email.service';
import { EmailController } from './email.controller';

describe('EmailController', () => {
  let controller: EmailController;
  const emailService = {
    syncTemplates: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [{ provide: EmailService, useValue: emailService }],
    }).compile();

    controller = module.get(EmailController);
    vi.clearAllMocks();
  });

  it('syncronizeTemplate delegates to EmailService', async () => {
    emailService.syncTemplates.mockResolvedValue('ok');

    const result = await controller.syncronizeTemplate();

    expect(emailService.syncTemplates).toHaveBeenCalled();
    expect(result).toBe('ok');
  });
});
