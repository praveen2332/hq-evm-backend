import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Price } from './prices.entity'
import { BaseService } from '../../../core/base.service'

@Injectable()
export class PricesRepository extends BaseService<Price> {
  constructor(
    @InjectRepository(Price)
    private pricesRepository: Repository<Price>
  ) {
    super(pricesRepository)
  }

  getOneByCurrencyAndDateAndId(params: { date: string; cryptocurrencyId: string; currency: string }) {
    return this.findOne({
      where: {
        date: params.date,
        cryptocurrency: {
          id: params.cryptocurrencyId
        },
        currency: params.currency.toLowerCase()
      }
    })
  }

  getOneByCurrencyAndDateAndSymbol(params: { date: string; symbol: string; currency: string }) {
    return this.findOne({
      where: {
        date: params.date,
        cryptocurrency: {
          symbol: params.symbol
        },
        currency: params.currency
      }
    })
  }
}
