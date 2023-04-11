import { Module } from '@nestjs/common'
import { LoggerModule } from '../common/logger/logger.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { FinancialTransactionsEntityModule } from '../common/services/financial-transactions/financial-transactions.entity.module'
import { GainsLossesEntityModule } from '../common/services/gains-losses/gains-losses.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { PricesModule } from '../prices/prices.module'
import { AssetsController } from './assets.controller'
import { AssetsDomainService } from './assets.domain.service'

@Module({
  imports: [
    FinancialTransactionsEntityModule,
    PricesModule,
    CryptocurrenciesEntityModule,
    GainsLossesEntityModule,
    MembersEntityModule,
    WalletsEntityModule,
    LoggerModule
  ],
  controllers: [AssetsController],
  providers: [AssetsDomainService],
  exports: [AssetsDomainService]
})
export class AssetsModule {}
