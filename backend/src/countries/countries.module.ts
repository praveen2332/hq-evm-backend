import { Module } from '@nestjs/common'
import { CountriesController } from './countries.controller'
import { CountriesEntityModule } from '../common/services/countries/countries.entity.module'

@Module({
  imports: [CountriesEntityModule],
  controllers: [CountriesController],
  providers: [],
  exports: []
})
export class CountriesModule {}
