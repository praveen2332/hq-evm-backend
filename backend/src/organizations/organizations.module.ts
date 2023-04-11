import { forwardRef, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CategoriesModule } from '../categories/categories.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { RolesEntityModule } from '../common/services/roles/roles.entity.module'
import { OrganizationsController } from './organizations.controller'
import { SourceOfFundsModule } from '../source-of-funds/source-of-funds.module'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { GeneralServicesModule } from '../common/services/general/general-services.module'
import { WalletGroupEntityModule } from '../common/services/wallet-groups/wallet-group.entity.module'
import { OrganizationSettingsEntityModule } from '../common/services/organization-settings/organization-settings.entity.module'
import { TimezonesEntityModule } from '../common/services/timezones/timezones.entity.module'
import { CountriesEntityModule } from '../common/services/countries/countries.entity.module'
import { FiatCurrenciesEntityModule } from '../common/services/fiat-currencies/fiat-currencies.entity.module'

@Module({
  imports: [
    RolesEntityModule,
    OrganizationsEntityModule,
    GeneralServicesModule,
    ContactsEntityModule,
    MembersEntityModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    WalletGroupEntityModule,
    OrganizationSettingsEntityModule,
    TimezonesEntityModule,
    CountriesEntityModule,
    FiatCurrenciesEntityModule,
    forwardRef(() => SourceOfFundsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CategoriesModule)
  ],
  providers: [],
  controllers: [OrganizationsController],
  exports: []
})
export class OrganizationsModule {}
