import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CountriesService } from './countries.service'
import { Country } from './country.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [],
  providers: [CountriesService],
  exports: [TypeOrmModule, CountriesService]
})
export class CountriesEntityModule {}
