import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CategoriesModule } from '../categories/categories.module'
import { LoggerModule } from '../common/logger/logger.module'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { FinancialTransactionsEntityModule } from '../common/services/financial-transactions/financial-transactions.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationSettingsEntityModule } from '../common/services/organization-settings/organization-settings.entity.module'
import { FilesModule } from '../files/files.module'
import { FinancialTransactionsController } from './financial-transactions.controller'
import { FinancialTransactionsDomainService } from './financial-transactions.domain.service'

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    HttpModule,
    FinancialTransactionsEntityModule,
    ContactsEntityModule,
    MembersEntityModule,
    CategoriesModule,
    FilesModule,
    OrganizationSettingsEntityModule,
    FilesModule
  ],
  controllers: [FinancialTransactionsController],
  providers: [FinancialTransactionsDomainService],
  exports: []
})
export class FinancialTransactionsModule {}
