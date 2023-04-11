import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'
import { OrganizationSetting } from '../common/services/organization-settings/organization-setting.entity'
import { CountryDto } from '../countries/interfaces'
import { FiatCurrencyDetailedDto } from '../fiat-currencies/interfaces'
import { TimezoneDto } from '../timezones/interfaces'

export class SettingsDto {
  @ApiProperty({ nullable: true })
  timezone: TimezoneDto

  @ApiProperty({ nullable: true })
  country: CountryDto

  /*  @ApiProperty({ example: CostBasisCalculationMethod.FIFO })
  costBasisMethod: CostBasisCalculationMethod*/

  @ApiProperty()
  fiatCurrency: FiatCurrencyDetailedDto

  public static map(organizationSetting: OrganizationSetting): SettingsDto {
    const settingsDto = new SettingsDto()
    settingsDto.timezone = organizationSetting.timezone ? TimezoneDto.map(organizationSetting.timezone) : null
    settingsDto.country = organizationSetting.country ? CountryDto.map(organizationSetting.country) : null
    // settingsDto.costBasisMethod = organizationSetting.costBasisMethod
    settingsDto.fiatCurrency = FiatCurrencyDetailedDto.map(organizationSetting.fiatCurrency)
    return settingsDto
  }
}

export class UpdateSettingDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  timezoneId: string

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  countryId: string

  // @IsOptional()
  // @IsEnum(CostBasisCalculationMethod)
  // @ApiPropertyOptional({
  //   type: () => CostBasisCalculationMethod,
  //   enum: CostBasisCalculationMethod,
  //   example: CostBasisCalculationMethod.FIFO
  // })
  // costBasisMethod: CostBasisCalculationMethod

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'USD' })
  fiatCurrency: string
}
