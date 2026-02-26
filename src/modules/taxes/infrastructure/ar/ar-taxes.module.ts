import { Module } from '@nestjs/common';
import { TAX_PROVIDERS } from '../../domain/taxes.const';
import { AfipAuthModule } from './afip/auth/afip-auth.module';
import { ArTaxesProvider } from './ar-taxes.provider';

@Module({
  imports: [AfipAuthModule],
  providers: [
    ArTaxesProvider,
    {
      provide: TAX_PROVIDERS,
      useExisting: ArTaxesProvider,
    },
  ],
  exports: [TAX_PROVIDERS],
})
export class ArTaxesModule {}
