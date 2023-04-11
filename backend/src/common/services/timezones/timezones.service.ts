import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Timezone } from './timezone.entity'

@Injectable()
export class TimezonesService extends BaseService<Timezone> {
  constructor(
    @InjectRepository(Timezone)
    private timezoneRepository: Repository<Timezone>
  ) {
    super(timezoneRepository)
  }

  async getDefault() {
    return this.timezoneRepository.findOne({
      where: {
        abbrev: 'MPST'
      }
    })
  }
}
