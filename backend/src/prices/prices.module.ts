import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CoingeckoModule } from '../coingecko/coingecko.module'
import { LoggerModule } from '../common/logger/logger.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { PricesEntityModule } from '../common/services/prices/prices.entity.module'
import { PricesController } from './prices.controller'
import { PricesService } from './prices.service'

@Module({
  imports: [PricesEntityModule, CryptocurrenciesEntityModule, CoingeckoModule, LoggerModule, HttpModule, ConfigModule],
  providers: [PricesService],
  controllers: [PricesController],
  exports: [PricesService]
})
export class PricesModule {}
