import { Controller, Get, Query } from '@nestjs/common'
import { CoingeckoDomainService } from './coingecko.domain.service'
import { CoinHistoryParams, SimplePriceParams } from './interface'

@Controller('coingecko')
export class CoingeckoController {
  constructor(private coingeckoDomainService: CoingeckoDomainService) {}

  @Get('simple/price')
  simplePrice(@Query() query: SimplePriceParams) {
    return this.coingeckoDomainService.getSimplePrice(query.ids, query.vs_currencies)
  }

  @Get('coins/history')
  coinsHistory(@Query() query: CoinHistoryParams) {
    return this.coingeckoDomainService.getCoinsHistory(query.id, query.date)
  }
}
