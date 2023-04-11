import { Transform } from 'class-transformer'
import Decimal from 'decimal.js'

export function ToArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (!value) {
      return null
    }
    return Array.isArray(value) ? value : [value]
  })
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(({ value }) => {
    if (!value) {
      return value
    }
    return Array.isArray(value) ? value.map((v) => v.toLowerCase()) : [value?.toLowerCase()]
  })
}

export function ToDecimal(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return value
    }

    //Should return Instance of Decimal, but if value is invalid, we expect that class-validator will handle it
    //see @IsInstance(Decimal) in the DTO
    try {
      return new Decimal(value)
    } catch (error) {
      return value
    }
  })
}
