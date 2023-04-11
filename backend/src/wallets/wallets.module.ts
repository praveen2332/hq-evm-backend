import { Module } from '@nestjs/common'
import { LoggerModule } from '../common/logger/logger.module'
import { BlockchainsEntityModule } from '../common/services/blockchains/blockchains.entity.module'
import { FeatureFlagsEntityModule } from '../common/services/feature-flags/feature-flags.entity.module'
import { FinancialTransactionsEntityModule } from '../common/services/financial-transactions/financial-transactions.entity.module'
import { GainsLossesEntityModule } from '../common/services/gains-losses/gains-losses.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { WalletGroupEntityModule } from '../common/services/wallet-groups/wallet-group.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { FinancialTransformationsModule } from '../financial-transformations/financial-transformations.module'
import { PricesModule } from '../prices/prices.module'
import { WalletsListener } from './listeners/wallets.listener'
import { WalletsController } from './wallets.controller'
import { WalletsDomainService } from './wallets.domain.service'
import { BlockExplorerModule } from '../block-explorers/block-explorer.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'

@Module({
  imports: [
    WalletsEntityModule,
    WalletGroupEntityModule,
    MembersEntityModule,
    GeneralServicesModule,
    FinancialTransformationsModule,
    FinancialTransactionsEntityModule,
    PricesModule,
    LoggerModule,
    FeatureFlagsEntityModule,
    GainsLossesEntityModule,
    BlockchainsEntityModule,
    CryptocurrenciesEntityModule,
    BlockExplorerModule
  ],
  controllers: [WalletsController],
  providers: [WalletsDomainService, WalletsListener],
  exports: []
})
export class WalletsModule {}
