import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Country } from './country.entity'

@Injectable()
export class CountriesService extends BaseService<Country> {
  constructor(
    @InjectRepository(Country)
    private countriesRepository: Repository<Country>
  ) {
    super(countriesRepository)
  }

  async getDefault() {
    return this.countriesRepository.findOne({
      where: {
        iso3: 'SGP'
      }
    })
  }
}
