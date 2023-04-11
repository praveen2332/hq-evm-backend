import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BlockExplorerModule } from '../block-explorers/block-explorer.module'
import { LoggerModule } from '../common/logger/logger.module'
import { AdditionalTransformationPerWalletGroupTasksEntityModule } from '../common/services/additional-transformation-per-wallet-group-tasks/additional-transformation-per-wallet-group-tasks.entity.module'
import { AdditionalTransformationPerWalletTasksEntityModule } from '../common/services/additional-transformation-per-wallet-tasks/additional-transformation-per-wallet-tasks.entity.module'
import { BlockchainsEntityModule } from '../common/services/blockchains/blockchains.entity.module'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'
import { CoreTransformationTasksEntityModule } from '../common/services/core-transformation-tasks/core-transformation-tasks.entity.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { FeatureFlagsEntityModule } from '../common/services/feature-flags/feature-flags.entity.module'
import { FinancialTransactionsEntityModule } from '../common/services/financial-transactions/financial-transactions.entity.module'
import { GainsLossesEntityModule } from '../common/services/gains-losses/gains-losses.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'
import { IngestionTaskEntityModule } from '../common/services/ingestion-task/ingestion-task.entity.module'
import { OrganizationSettingsEntityModule } from '../common/services/organization-settings/organization-settings.entity.module'
import { PreprocessRawTasksEntityModule } from '../common/services/preprocess-raw-tasks/preprocess-raw-tasks.entity.module'
import { RawTransactionEntityModule } from '../common/services/raw-transactions/raw-transaction.entity.module'
import { WalletGroupEntityModule } from '../common/services/wallet-groups/wallet-group.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { PricesModule } from '../prices/prices.module'
import { SourceOfFundsModule } from '../source-of-funds/source-of-funds.module'
import { AdditionalTransformationsPerWalletGroupDomainService } from './additional-transformations-per-wallet-group.domain.service'
import { AdditionalTransformationsPerWalletDomainService } from './additional-transformations-per-wallet.domain.service'
import { CoreTransformationsDomainService } from './core-transformations.domain.service'
import { FinancialTransformationsDomainService } from './financial-transformations.domain.service'
import { AdditionalTransformationsListener } from './listeners/additional-transformation-tasks.listener'
import { CoreTransformationTasksListener } from './listeners/core-transformation-tasks.listener'
import { IngestionTasksListener } from './listeners/ingestion-tasks.listener'
import { OperationalTransformationsListener } from './listeners/operational-transformation-tasks.listener'
import { PreprocessRawTasksListener } from './listeners/preprocess-raw-tasks.listener'
import { OperationalTransformationsDomainService } from './operational-transformations.domain.service'
import { PreprocessRawsDomainService } from './preprocess-raws.domain.service'
import { WalletsTransformationsDomainService } from './wallets-transformations.domain.service'

@Module({
  imports: [
    LoggerModule,
    ChainsEntityModule,
    CoreTransformationTasksEntityModule,
    AdditionalTransformationPerWalletTasksEntityModule,
    AdditionalTransformationPerWalletGroupTasksEntityModule,
    forwardRef(() => SourceOfFundsModule),
    FinancialTransactionsEntityModule,
    IngestionTaskEntityModule,
    RawTransactionEntityModule,
    CryptocurrenciesEntityModule,
    PreprocessRawTasksEntityModule,
    GainsLossesEntityModule,
    PricesModule,
    ConfigModule,
    HttpModule,
    GeneralServicesModule,
    WalletsEntityModule,
    WalletGroupEntityModule,
    FeatureFlagsEntityModule,
    OrganizationSettingsEntityModule,
    BlockchainsEntityModule,
    BlockExplorerModule
  ],
  providers: [
    FinancialTransformationsDomainService,
    PreprocessRawsDomainService,
    CoreTransformationsDomainService,
    AdditionalTransformationsPerWalletDomainService,
    AdditionalTransformationsPerWalletGroupDomainService,
    OperationalTransformationsDomainService,
    PreprocessRawTasksListener,
    CoreTransformationTasksListener,
    AdditionalTransformationsListener,
    OperationalTransformationsListener,
    IngestionTasksListener,
    WalletsTransformationsDomainService
  ],
  exports: [
    FinancialTransformationsDomainService,
    CoreTransformationsDomainService,
    AdditionalTransformationsPerWalletDomainService,
    AdditionalTransformationsPerWalletGroupDomainService,
    PreprocessRawsDomainService,
    WalletsTransformationsDomainService
  ]
})
export class FinancialTransformationsModule {}
