import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { isEthereumAddress } from 'class-validator'

@Injectable()
export class AddressPipe implements PipeTransform {
  transform(value: string) {
    if (isEthereumAddress(value)) {
      return value
    }

    throw new BadRequestException('Invalid address')
  }
}
