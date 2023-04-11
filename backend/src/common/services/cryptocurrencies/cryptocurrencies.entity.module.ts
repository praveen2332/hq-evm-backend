import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CoingeckoModule } from '../../../coingecko/coingecko.module'
import { FilesModule } from '../../../files/files.module'
import { LoggerModule } from '../../logger/logger.module'
import { CryptocurrenciesService } from './cryptocurrencies.service'
import { CryptocurrencyAddress } from './cryptocurrency-address.entity'
import { Cryptocurrency } from './cryptocurrency.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Cryptocurrency, CryptocurrencyAddress]),
    FilesModule,
    HttpModule,
    CoingeckoModule,
    LoggerModule
  ],
  providers: [CryptocurrenciesService],
  exports: [TypeOrmModule, CryptocurrenciesService]
})
export class CryptocurrenciesEntityModule {}
