import { Module } from '@nestjs/common'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { RolesEntityModule } from '../common/services/roles/roles.entity.module'
import { TokensEntityModule } from '../common/services/tokens/tokens.entity.module'
import { MemberDomainService } from './member.domain.service'
import { MembersController } from './members.controller'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'

@Module({
  imports: [
    MembersEntityModule,
    RolesEntityModule,
    CryptocurrenciesEntityModule,
    ContactsEntityModule,
    OrganizationsEntityModule,
    AccountsEntityModule,
    TokensEntityModule,
    GeneralServicesModule
  ],
  providers: [MemberDomainService],
  controllers: [MembersController],
  exports: []
})
export class MembersModule {}
