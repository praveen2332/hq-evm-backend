import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from '../common/logger/logger.module'
import { MigrateTxDataController } from './migrate-tx-data.controller'
import { TransactionsModule } from '../transactions/transactions.module'
import { FilesModule } from '../files/files.module'
import { FinancialTransactionsEntityModule } from '../common/services/financial-transactions/financial-transactions.entity.module'
import { FeatureFlagsEntityModule } from '../common/services/feature-flags/feature-flags.entity.module'

@Module({
  imports: [
    TransactionsModule,
    FeatureFlagsEntityModule,
    FinancialTransactionsEntityModule,
    FilesModule,
    LoggerModule,
    HttpModule,
    ConfigModule
  ],
  providers: [],
  controllers: [MigrateTxDataController],
  exports: []
})
export class MigrateTxDataModule {}
