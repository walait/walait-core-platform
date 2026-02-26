import { Test, type TestingModule } from '@nestjs/testing';
import type { ITaxProvider } from '../domain/provider.interface';
import { TAX_PROVIDERS } from '../domain/taxes.const';
import { TaxesService } from './taxes.service';

describe('TaxesService', () => {
  let service: TaxesService;
  let provider: jest.Mocked<ITaxProvider>;

  beforeEach(async () => {
    provider = {
      canHandle: jest.fn().mockReturnValue(true),
      process: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxesService, { provide: TAX_PROVIDERS, useValue: [provider] }],
    }).compile();

    service = module.get<TaxesService>(TaxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates payment to matching provider', async () => {
    const payment = { id: '1', countryIso: 'AR' } as any;
    provider.process.mockResolvedValue({ externalId: 'x' } as any);
    await service.processPayment(payment);
    expect(provider.process).toHaveBeenCalledWith(payment);
  });

  it('throws when no provider found', async () => {
    provider.canHandle.mockReturnValue(false);
    const payment = { id: '1', countryIso: 'AR' } as any;
    await expect(service.processPayment(payment)).rejects.toThrow();
  });
});
