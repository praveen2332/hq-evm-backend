import { Module } from '@nestjs/common'
import { LoggerModule } from '../common/logger/logger.module'
import { CountriesEntityModule } from '../common/services/countries/countries.entity.module'
import { FiatCurrenciesEntityModule } from '../common/services/fiat-currencies/fiat-currencies.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationSettingsEntityModule } from '../common/services/organization-settings/organization-settings.entity.module'
import { TimezonesEntityModule } from '../common/services/timezones/timezones.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { SettingsController } from './settings.controller'
import { SettingsDomainService } from './settings.domain.service'
import { BlockchainsEntityModule } from '../common/services/blockchains/blockchains.entity.module'
import { FinancialTransformationsModule } from '../financial-transformations/financial-transformations.module'

@Module({
  imports: [
    OrganizationSettingsEntityModule,
    MembersEntityModule,
    LoggerModule,
    CountriesEntityModule,
    FiatCurrenciesEntityModule,
    TimezonesEntityModule,
    WalletsEntityModule,
    BlockchainsEntityModule,
    FinancialTransformationsModule
  ],
  controllers: [SettingsController],
  providers: [SettingsDomainService],
  exports: []
})
export class SettingsModule {}
