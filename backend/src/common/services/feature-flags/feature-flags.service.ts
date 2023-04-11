import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { dateHelper } from '../../helpers/date.helper'
import { LoggerService } from '../../logger/logger.service'
import { FeatureFlag } from './feature-flag.entity'
import { FeatureFlagOption } from './interfaces'

@Injectable()
export class FeatureFlagsService extends BaseService<FeatureFlag> {
  private LAST_LOGGER_TIMESTAMP_GET_TIME: number
  private readonly MINUTE_OFFSET: number
  constructor(
    @InjectRepository(FeatureFlag)
    private featureFlagsRepository: Repository<FeatureFlag>,
    private logger: LoggerService
  ) {
    super(featureFlagsRepository)
    this.LAST_LOGGER_TIMESTAMP_GET_TIME = 0
    this.MINUTE_OFFSET = 60 * 1000
  }

  async isFeatureEnabled(name: FeatureFlagOption): Promise<boolean> {
    const flag = await this.featureFlagsRepository.findOne({ where: { name: name, isEnabled: true } })

    const isEnabled = !!flag

    const tempDate = dateHelper.getUTCTimestamp()
    if (tempDate.getTime() - this.LAST_LOGGER_TIMESTAMP_GET_TIME > 1 * this.MINUTE_OFFSET) {
      this.logger.log(`FEATURE FLAG = '${name}' is '${isEnabled ? 'enabled' : 'NOT enabled'}' `)
      this.LAST_LOGGER_TIMESTAMP_GET_TIME = tempDate.getTime()
    }

    return isEnabled
  }
}
