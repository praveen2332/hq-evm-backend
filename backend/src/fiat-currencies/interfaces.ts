import { ApiProperty } from '@nestjs/swagger'
import { FiatCurrency } from '../common/services/fiat-currencies/fiat-currency.entity'

export class FiatCurrencyDetailedDto {
  @ApiProperty({ example: 'US Dollar' })
  name: string

  @ApiProperty({
    description: 'This is the unique id of the fiat currency. String specificed here will be uppercased.',
    example: 'USD'
  })
  code: string

  @ApiProperty({ example: '$' })
  symbol: string

  @ApiProperty({ example: 2 })
  decimal: number

  static map(fiatCurrency: FiatCurrency): FiatCurrencyDetailedDto {
    const result = new FiatCurrencyDetailedDto()
    result.name = fiatCurrency.name
    result.code = fiatCurrency.alphabeticCode
    result.symbol = fiatCurrency.symbol
    result.decimal = fiatCurrency.decimal

    return result
  }
}
