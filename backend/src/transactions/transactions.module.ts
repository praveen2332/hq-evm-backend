import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { CategoriesModule } from '../categories/categories.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { SchedulesModule } from '../schedules/schedules.module'
import { SourceOfFundsModule } from '../source-of-funds/source-of-funds.module'
import { Transaction } from './transaction.entity'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    OrganizationsEntityModule,
    MembersEntityModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    forwardRef(() => ContactsEntityModule),
    forwardRef(() => AuthModule),
    forwardRef(() => SourceOfFundsModule),
    CategoriesModule,
    ChainsEntityModule,
    HttpModule,
    forwardRef(() => SchedulesModule)
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TypeOrmModule, TransactionsService]
})
export class TransactionsModule {}
