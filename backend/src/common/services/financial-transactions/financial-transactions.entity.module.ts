import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../../logger/logger.module'
import { BlockchainsEntityModule } from '../blockchains/blockchains.entity.module'
import { GeneralServicesModule } from '../general/general-services.module'
import { WalletsEntityModule } from '../wallets/wallets.entity.module'
import { FinancialTransactionChildMetadata } from './financial-transaction-child-metadata.entity'
import { FinancialTransactionChild } from './financial-transaction-child.entity'
import { FinancialTransactionFile } from './financial-transaction-files.entity'
import { FinancialTransactionParent } from './financial-transaction-parent.entity'
import { FinancialTransactionPreprocess } from './financial-transaction-preprocess.entity'
import { FinancialTransactionsEntityService } from './financial-transactions.entity.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransactionParent,
      FinancialTransactionChild,
      FinancialTransactionChildMetadata,
      FinancialTransactionPreprocess,
      FinancialTransactionFile
    ]),
    LoggerModule,
    GeneralServicesModule,
    WalletsEntityModule,
    BlockchainsEntityModule
  ],
  providers: [FinancialTransactionsEntityService],
  exports: [TypeOrmModule, FinancialTransactionsEntityService]
})
export class FinancialTransactionsEntityModule {}
