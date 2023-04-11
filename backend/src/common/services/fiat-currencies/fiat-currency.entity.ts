import { Column, Entity, Unique } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'

@Entity()
@Unique('UQ_fiat_currency_alphabetic_code', ['alphabeticCode'])
export class FiatCurrency extends BaseEntity {
  @Column()
  name: string
  @Column({ name: 'alphabetic_code' })
  alphabeticCode: string
  @Column({ name: 'numeric_code' })
  numericCode: number
  @Column()
  symbol: string
  @Column()
  decimal: number
}
