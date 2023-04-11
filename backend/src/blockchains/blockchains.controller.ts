import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { BlockchainsDetailedDto } from './interfaces'

@ApiTags('blockchains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BlockchainsController {
  constructor(private blockchainsService: BlockchainsService) {}

  @Get()
  @ApiResponse({ status: 200, type: BlockchainsDetailedDto, isArray: true })
  async getAll() {
    const blockchains = await this.blockchainsService.getEnabledBlockchains()

    return blockchains.map((blockchain) => BlockchainsDetailedDto.map(blockchain))
  }
}
