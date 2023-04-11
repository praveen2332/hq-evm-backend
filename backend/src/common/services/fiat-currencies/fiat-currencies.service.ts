import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { FiatCurrency } from './fiat-currency.entity'

@Injectable()
export class FiatCurrenciesService extends BaseService<FiatCurrency> {
  constructor(
    @InjectRepository(FiatCurrency)
    private fiatCurrencyRepository: Repository<FiatCurrency>
  ) {
    super(fiatCurrencyRepository)
  }

  async getByAlphabeticCode(alphabeticCode: string): Promise<FiatCurrency> {
    return await this.fiatCurrencyRepository.findOne({
      where: {
        alphabeticCode: alphabeticCode.toUpperCase()
      }
    })
  }

  async getDefault() {
    return this.getByAlphabeticCode('SGD')
  }
}
