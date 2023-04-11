import { Module } from '@nestjs/common'
import { FiatCurrenciesEntityModule } from '../common/services/fiat-currencies/fiat-currencies.entity.module'
import { FiatCurrenciesController } from './fiat-currencies.controller'

@Module({
  imports: [FiatCurrenciesEntityModule],
  controllers: [FiatCurrenciesController],
  providers: [],
  exports: []
})
export class FiatCurrenciesModule {}
