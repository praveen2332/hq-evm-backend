import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import {  isString } from 'class-validator'

@Injectable()
export class CategoryPipe implements PipeTransform {
  transform(value: string) {
    if (isString(value)) {
      return value
    }

    throw new BadRequestException('Invalid category')
  }
}
