import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Country } from '../countries/country.entity'
import { FiatCurrency } from '../fiat-currencies/fiat-currency.entity'
import { CostBasisCalculationMethod } from '../gains-losses/interfaces'
import { Organization } from '../organizations/organization.entity'
import { Timezone } from '../timezones/timezone.entity'

@Entity()
export class OrganizationSetting extends BaseEntity {
  @OneToOne(() => Organization, (organization) => organization.setting)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_id' })
  country: Country

  @ManyToOne(() => Timezone)
  @JoinColumn({ name: 'timezone_id' })
  timezone: Timezone

  @ManyToOne(() => FiatCurrency)
  @JoinColumn({ name: 'fiat_currency_id' })
  fiatCurrency: FiatCurrency

  @Column({
    name: 'cost_basis_method',
    type: 'enum',
    enum: CostBasisCalculationMethod,
    default: CostBasisCalculationMethod.FIFO
  })
  costBasisMethod: CostBasisCalculationMethod

  static create(param: {
    organization: Organization
    costBasisMethod: CostBasisCalculationMethod
    fiatCurrency: FiatCurrency
    timezone: Timezone
    country: Country
  }): OrganizationSetting {
    const organizationSetting = new OrganizationSetting()
    organizationSetting.organization = param.organization
    organizationSetting.costBasisMethod = param.costBasisMethod
    organizationSetting.fiatCurrency = param.fiatCurrency
    organizationSetting.timezone = param.timezone
    organizationSetting.country = param.country
    return organizationSetting
  }
}
