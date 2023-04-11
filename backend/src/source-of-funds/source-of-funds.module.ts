import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { LoggerModule } from '../common/logger/logger.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { IngestionTaskEntityModule } from '../common/services/ingestion-task/ingestion-task.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { FinancialTransformationsModule } from '../financial-transformations/financial-transformations.module'
import { SchedulesModule } from '../schedules/schedules.module'
import { SourceCdcModule } from './source-cdc/source-cdc.module'
import { SourceCoinbaseModule } from './source-coinbase/source-coinbase.module'
import { SourceEthModule } from './source-eth-eoa/source-eth-eoa.module'
import { SourceEthService } from './source-eth-eoa/source-eth-eoa.service'
import { SourceFtxModule } from './source-ftx/source-ftx.module'
import { SourceFtxService } from './source-ftx/source-ftx.service'
import { SourceGnosisModule } from './source-gnosis/source-gnosis.module'
import { SourceGnosisService } from './source-gnosis/source-gnosis.service'
import { SourceOfFund } from './source-of-fund.entity'
import { SourceOfFundsController } from './source-of-funds.controller'
import { SourceOfFundsService } from './source-of-funds.service'
import { GeneralServicesModule } from '../common/services/general/general-services.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([SourceOfFund]),
    OrganizationsEntityModule,
    MembersEntityModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    forwardRef(() => ContactsEntityModule),
    IngestionTaskEntityModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SchedulesModule),
    HttpModule,
    ConfigModule,
    SourceEthModule,
    SourceCdcModule,
    SourceFtxModule,
    SourceGnosisModule,
    SourceCoinbaseModule,
    forwardRef(() => FinancialTransformationsModule),
    LoggerModule,
    forwardRef(() => GeneralServicesModule)
  ],
  providers: [SourceOfFundsService, SourceEthService, SourceGnosisService, SourceFtxService],
  controllers: [SourceOfFundsController],
  exports: [TypeOrmModule, SourceOfFundsService, SourceEthService, SourceGnosisService, SourceFtxService]
})
export class SourceOfFundsModule {}
