import { Global, Module } from '@nestjs/common';

import { BaseSoapClient } from './services/baseSoapClient.service';

@Global()
@Module({
  providers: [BaseSoapClient],
  exports: [BaseSoapClient],
})
export class SharedTaxesAR {}
