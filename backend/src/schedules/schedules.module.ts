import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PricesModule } from '../prices/prices.module'
import { SourceOfFundsModule } from '../source-of-funds/source-of-funds.module'
import { TransactionsModule } from '../transactions/transactions.module'
import { SchedulesService } from './schedules.service'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'
import { LoggerModule } from '../common/logger/logger.module'
import { InvitationsEntityModule } from '../common/services/invitations/invitations.entity.module'
import { TransformationScheduler } from './transformation.scheduler'
import { IngestionTaskEntityModule } from '../common/services/ingestion-task/ingestion-task.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    ChainsEntityModule,
    LoggerModule,
    InvitationsEntityModule,
    IngestionTaskEntityModule,
    forwardRef(() => TransactionsModule),
    forwardRef(() => SourceOfFundsModule),
    forwardRef(() => PricesModule),
    GeneralServicesModule
  ],
  providers: [SchedulesService, TransformationScheduler],
  exports: [SchedulesService]
})
export class SchedulesModule {}
