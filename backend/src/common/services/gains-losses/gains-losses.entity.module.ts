import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GainsLossesService } from './gains-losses.service'
import { TaxLotSale } from './tax-lot-sale.entity'
import { TaxLot } from './tax-lot.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TaxLot, TaxLotSale])],
  providers: [GainsLossesService],
  exports: [TypeOrmModule, GainsLossesService]
})
export class GainsLossesEntityModule {}
