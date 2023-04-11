import { Controller, Get, Query } from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { PricesService } from './prices.service'

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  SECRET = 'mB0246@vjbxk'
  constructor(private pricesService: PricesService) {}

  @Get('sync')
  @ApiQuery({ name: 'secret', type: 'string' })
  @ApiQuery({ name: 'daily', type: 'string', required: false })
  @ApiQuery({ name: 'date', type: 'string', required: false, example: '15-01-2021' })
  sync(@Query() query: { secret: string; daily: string; date: string }) {
    if (query.secret === this.SECRET) {
      if (query.daily) {
        return this.pricesService.syncDaily(query.date)
      } else {
        return this.pricesService.syncData()
      }
    }
    return true
  }
}
