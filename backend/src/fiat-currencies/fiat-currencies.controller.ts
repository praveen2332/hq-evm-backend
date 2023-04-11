import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FiatCurrenciesService } from '../common/services/fiat-currencies/fiat-currencies.service'
import { FiatCurrencyDetailedDto } from './interfaces'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('fiat-currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FiatCurrenciesController {
  constructor(private fiatCurrenciesService: FiatCurrenciesService) {}

  @Get()
  @ApiResponse({ status: 200, type: FiatCurrencyDetailedDto, isArray: true })
  async getAll() {
    const fiatCurrencies = await this.fiatCurrenciesService.find({
      order: {
        name: 'ASC'
      }
    })

    return fiatCurrencies.map((fiatCurrency) => FiatCurrencyDetailedDto.map(fiatCurrency))
  }

  @Get(':code')
  @ApiResponse({ status: 200, type: FiatCurrencyDetailedDto, isArray: true })
  async getByCode(@Param('code') code: string) {
    const fiatCurrency = await this.fiatCurrenciesService.getByAlphabeticCode(code)

    if (fiatCurrency) {
      return FiatCurrencyDetailedDto.map(fiatCurrency)
    }

    throw new NotFoundException()
  }
}
