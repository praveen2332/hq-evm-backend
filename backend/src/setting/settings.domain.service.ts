import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { FindOptionsRelations } from 'typeorm'
import { LoggerService } from '../common/logger/logger.service'
import { CountriesService } from '../common/services/countries/countries.service'
import { FiatCurrenciesService } from '../common/services/fiat-currencies/fiat-currencies.service'
import { OrganizationSetting } from '../common/services/organization-settings/organization-setting.entity'
import { OrganizationSettingsService } from '../common/services/organization-settings/organization-settings.service'
import { TimezonesService } from '../common/services/timezones/timezones.service'
import { WalletsService } from '../common/services/wallets/wallets.service'
import {
  ChangeFiatCurrencyForOrganizationEventParams,
  FinancialTransformationsEventType
} from '../financial-transformations/events/events'
import { SettingsDto, UpdateSettingDto } from './interfaces'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { WalletsTransformationsDomainService } from '../financial-transformations/wallets-transformations.domain.service'
import { WalletStatusesEnum } from '../common/services/wallets/interfaces'

@Injectable()
export class SettingsDomainService {
  allRelations: FindOptionsRelations<OrganizationSetting> = { country: true, fiatCurrency: true, timezone: true }

  constructor(
    private logger: LoggerService,
    private organizationSettingsService: OrganizationSettingsService,
    private countriesService: CountriesService,
    private timezonesService: TimezonesService,
    private fiatCurrenciesService: FiatCurrenciesService,
    private walletsService: WalletsService,
    private eventEmitter: EventEmitter2,
    private readonly blockchainsService: BlockchainsService,
    private readonly walletsTransformationsDomainService: WalletsTransformationsDomainService
  ) {}

  async getByOrganizationId(organizationId: string) {
    const organizationSetting = await this.organizationSettingsService.getByOrganizationId(
      organizationId,
      this.allRelations
    )
    if (organizationSetting) {
      return SettingsDto.map(organizationSetting)
    }
    throw new NotFoundException('Settings not found')
  }

  async update(organizationId: string, updateSettingDto: UpdateSettingDto) {
    const organizationSetting = await this.organizationSettingsService.getByOrganizationId(organizationId, {
      fiatCurrency: true
    })
    if (!organizationSetting) {
      throw new NotFoundException('Settings not found')
    }

    let newSetting: Partial<OrganizationSetting> = {}
    // if (updateSettingDto.costBasisMethod && updateSettingDto.costBasisMethod !== organizationSetting.costBasisMethod) {
    //   // TODO: fire event for additional transformation
    //   newSetting = {
    //     ...newSetting,
    //     costBasisMethod: updateSettingDto.costBasisMethod
    //   }
    // }
    if (updateSettingDto.countryId) {
      const country = await this.countriesService.findByPublicId(updateSettingDto.countryId)
      if (!country) {
        throw new BadRequestException('Can not find country')
      }
      newSetting = {
        ...newSetting,
        country: country
      }
    }

    if (updateSettingDto.timezoneId) {
      const timezone = await this.timezonesService.findByPublicId(updateSettingDto.timezoneId)
      if (!timezone) {
        throw new BadRequestException('Can not find timezone')
      }
      newSetting = {
        ...newSetting,
        timezone: timezone
      }
    }

    if (updateSettingDto.fiatCurrency) {
      const fiatCurrency = await this.fiatCurrenciesService.getByAlphabeticCode(updateSettingDto.fiatCurrency)
      if (!fiatCurrency) {
        throw new BadRequestException('Can not find fiat currency')
      }
      const maySyncFlag = await this.walletsTransformationsDomainService.maySetWalletsStatusForOrganization(
        organizationId,
        WalletStatusesEnum.SYNCING
      )
      if (maySyncFlag) {
        try {
          this.eventEmitter.emit(
            FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION,
            ChangeFiatCurrencyForOrganizationEventParams.map({
              organizationId,
              fiatCurrencyAlphabeticCode: fiatCurrency.alphabeticCode
            })
          )

          if (fiatCurrency.id !== organizationSetting.fiatCurrency.id) {
            newSetting = {
              ...newSetting,
              fiatCurrency: fiatCurrency
            }
          }
        } catch (e) {
          this.logger.error('Error while syncing wallets', e, {
            organizationId,
            fiatCurrencyAlphabeticCode: fiatCurrency.alphabeticCode
          })
          await this.walletsTransformationsDomainService.maySetWalletsStatusForOrganization(
            organizationId,
            WalletStatusesEnum.SYNCED
          )
        }
      } else {
        throw new BadRequestException('Wallets are not in the right state for syncing')
      }
    }

    await this.organizationSettingsService.partiallyUpdate(organizationSetting.id, newSetting)

    const updatedSetting = await this.organizationSettingsService.get(organizationSetting.id, {
      relations: this.allRelations
    })

    return SettingsDto.map(updatedSetting)
  }
}
