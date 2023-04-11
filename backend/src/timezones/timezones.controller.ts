import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { TimezoneDto } from './interfaces'
import { TimezonesService } from '../common/services/timezones/timezones.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('timezones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TimezonesController {
  constructor(private timezonesService: TimezonesService) {}

  @Get()
  @ApiOkResponse({ type: [TimezoneDto] })
  async getList() {
    const countries = await this.timezonesService.find({
      order: {
        utcOffset: 'ASC'
      }
    })
    return countries.map((country) => TimezoneDto.map(country))
  }
}
