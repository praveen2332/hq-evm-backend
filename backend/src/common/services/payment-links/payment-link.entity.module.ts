import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentLink } from './payment-link.entity'
import { PaymentLinkService } from './payment-link.service'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentLink])],
  providers: [PaymentLinkService],
  exports: [TypeOrmModule, PaymentLinkService]
})
export class PaymentLinkEntityModule {}
