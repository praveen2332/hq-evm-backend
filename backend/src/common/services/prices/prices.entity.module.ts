import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Price } from './prices.entity'
import { PricesRepository } from './prices.repository'

@Module({
  imports: [TypeOrmModule.forFeature([Price])],
  providers: [PricesRepository],
  controllers: [],
  exports: [TypeOrmModule, PricesRepository]
})
export class PricesEntityModule {}
