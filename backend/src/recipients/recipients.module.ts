import { HttpModule } from '@nestjs/axios'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from '../auth/auth.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { SourceOfFundsModule } from '../source-of-funds/source-of-funds.module'
import { RecipientsController } from './recipients.controller'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'
import { TokensEntityModule } from '../common/services/tokens/tokens.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MembersEntityModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    ContactsEntityModule,
    ChainsEntityModule,
    CryptocurrenciesEntityModule,
    OrganizationsEntityModule,
    TokensEntityModule,
    GeneralServicesModule,
    forwardRef(() => AuthModule),
    forwardRef(() => SourceOfFundsModule)
  ],
  controllers: [RecipientsController],
  providers: [],
  exports: []
})
export class RecipientsModule {}
