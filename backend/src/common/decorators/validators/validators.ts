import {
  buildMessage,
  ValidateBy,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import Decimal from 'decimal.js'

@ValidatorConstraint({ async: false })
export class CannotUseWith implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any
    return args.constraints.every((propertyName) => {
      return object[propertyName] === undefined
    })
  }

  defaultMessage(args: ValidationArguments) {
    return `Cannot be used with \`${args.constraints.join('` , `')}\`.`
  }
}

export function MinDecimal(minValue: number, validationOptions?: ValidationOptions): PropertyDecorator {
  function min(num: unknown, min: number): boolean {
    return num instanceof Decimal && typeof min === 'number' && num.greaterThanOrEqualTo(min)
  }

  return ValidateBy(
    {
      name: 'MIN_DECIMAL',
      constraints: [minValue],
      validator: {
        validate: (value, args): boolean => min(value, args?.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be greater than $constraint1',
          validationOptions
        )
      }
    },
    validationOptions
  )
}
