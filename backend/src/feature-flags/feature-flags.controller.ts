import { BadRequestException, Controller, Get, NotFoundException, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger'
import { FeatureFlagDto } from './interfaces'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { FeatureFlagsService } from '../common/services/feature-flags/feature-flags.service'
import { NoAuth } from '../common/decorators/no-auth.decorator'

@ApiTags('feature-flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class FeatureFlagsController {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  @Get()
  @NoAuth()
  @ApiQuery({ name: 'name', type: 'string', required: true, example: 'financial_transaction' })
  @ApiOkResponse({ type: FeatureFlagDto })
  async getFeatureFlag(@Query() query: { name: string }) {
    if (!query.name) {
      throw new BadRequestException('name is required')
    }
    const featureFlag = await this.featureFlagsService.findOne({
      where: {
        name: query.name
      }
    })
    if (!featureFlag) {
      throw new NotFoundException('Feature flag not found')
    }
    return FeatureFlagDto.map(featureFlag)
  }
}
