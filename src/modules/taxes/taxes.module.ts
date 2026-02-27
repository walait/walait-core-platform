import { Global, Module } from '@nestjs/common';
import { TaxesService } from './application/taxes.service';
import { ArTaxesModule } from './infrastructure/ar/ar-taxes.module';

@Global()
@Module({
  imports: [ArTaxesModule], // ← MUY IMPORTANTE
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}
