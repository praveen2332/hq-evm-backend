import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FiatCurrenciesService } from './fiat-currencies.service'
import { FiatCurrency } from './fiat-currency.entity'

@Module({
  imports: [TypeOrmModule.forFeature([FiatCurrency])],
  providers: [FiatCurrenciesService],
  exports: [TypeOrmModule, FiatCurrenciesService]
})
export class FiatCurrenciesEntityModule {}
