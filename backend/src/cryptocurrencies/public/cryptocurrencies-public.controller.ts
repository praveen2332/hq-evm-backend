import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CryptocurrenciesService } from '../../common/services/cryptocurrencies/cryptocurrencies.service'
import { CryptocurrencyResponseDto } from '../interfaces'

@ApiTags('cryptocurrencies')
@Controller('cryptocurrencies')
export class CryptocurrenciesPublicController {
  constructor(private cryptocurrenciesService: CryptocurrenciesService) {}

  @Get()
  @ApiResponse({ status: 200, type: CryptocurrencyResponseDto, isArray: true })
  async getAll() {
    const cryptocurrencies = await this.cryptocurrenciesService.find({
      relations: ['addresses']
    })

    for (let i = 0; i < cryptocurrencies.length; i++) {
      const curr = cryptocurrencies[i]
      if (!curr.image || !curr.image.large || !curr.image.small || !curr.image.thumb) {
        await this.cryptocurrenciesService.refreshImageForCryptocurrency(curr.id)
      }

      cryptocurrencies[i] = await this.cryptocurrenciesService.getById(curr.id)
    }

    return cryptocurrencies.map((cryptocurrency) => CryptocurrencyResponseDto.map(cryptocurrency))
  }
}
