import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaymentLinkMetadata } from './payment-link-metadata.entity'
import { BaseService } from '../core/base.service'

@Injectable()
export class PaymentLinkMetadataService extends BaseService<PaymentLinkMetadata> {
  constructor(
    @InjectRepository(PaymentLinkMetadata)
    private paymentLinkMetadataRepository: Repository<PaymentLinkMetadata>
  ) {
    super(paymentLinkMetadataRepository)
  }
}
