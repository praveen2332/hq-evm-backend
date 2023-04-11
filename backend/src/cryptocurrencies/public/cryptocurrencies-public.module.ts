import { Module } from '@nestjs/common'
import { CryptocurrenciesEntityModule } from '../../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { CryptocurrenciesPublicController } from './cryptocurrencies-public.controller'

@Module({
  imports: [CryptocurrenciesEntityModule],
  controllers: [CryptocurrenciesPublicController],
  providers: [],
  exports: []
})
export class CryptocurrenciesPublicModule {}
