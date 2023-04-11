import { Module } from '@nestjs/common'
import { PaymentLinkMetadataController } from './payment-link-metadata.controller'
import { PaymentLinkMetadataService } from './payment-link-metadata.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentLinkMetadata } from './payment-link-metadata.entity'
import { LoggerModule } from '../common/logger/logger.module'

@Module({
  imports: [TypeOrmModule.forFeature([PaymentLinkMetadata]), LoggerModule],
  controllers: [PaymentLinkMetadataController],
  providers: [PaymentLinkMetadataService],
  exports: []
})
export class PaymentLinkMetadataModule {}
