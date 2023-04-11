import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { BlockExplorerModule } from '../../../block-explorers/block-explorer.module'
import { SourceOfFundsModule } from '../../../source-of-funds/source-of-funds.module'
import { LoggerModule } from '../../logger/logger.module'
import { ContactsEntityModule } from '../contacts/contacts.entity.module'
import { IngestionTaskEntityModule } from '../ingestion-task/ingestion-task.entity.module'
import { MembersEntityModule } from '../members/members.entity.module'
import { RawTransactionEntityModule } from '../raw-transactions/raw-transaction.entity.module'
import { WalletsEntityModule } from '../wallets/wallets.entity.module'
import { GnosisProviderService } from './gnosis/gnosis-provider.service'
import { IngestionsService } from './ingestion/ingestions.service'
import { OrganizationAddressesService } from './organization-addresses.service'

@Module({
  imports: [
    HttpModule,
    IngestionTaskEntityModule,
    BlockExplorerModule,
    RawTransactionEntityModule,
    LoggerModule,
    WalletsEntityModule,
    ContactsEntityModule,
    MembersEntityModule,
    //TODO: Remove this forwardRef when we completely switch to wallets
    forwardRef(() => SourceOfFundsModule)
  ],
  providers: [GnosisProviderService, IngestionsService, OrganizationAddressesService],
  exports: [GnosisProviderService, IngestionsService, OrganizationAddressesService]
})
export class GeneralServicesModule {}
