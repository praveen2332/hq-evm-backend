import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { PaymentLink } from './payment-link.entity'

@Injectable()
export class PaymentLinkService extends BaseService<PaymentLink> {
  constructor(
    @InjectRepository(PaymentLink)
    private paymentLinkRepository: Repository<PaymentLink>
  ) {
    super(paymentLinkRepository)
  }

  getByAddressTokenChain(param: {
    organizationId: string
    address: string
    cryptocurrencyId: string
    blockchainId: string
  }) {
    return this.paymentLinkRepository.findOne({
      where: {
        address: param.address,
        organization: { id: param.organizationId },
        cryptocurrency: { id: param.cryptocurrencyId },
        blockchainId: param.blockchainId
      }
    })
  }

  getByOrganizationIdAndPublicId(param: { organizationId: string; publicId: string; relations?: string[] }) {
    return this.paymentLinkRepository.findOne({
      where: {
        publicId: param.publicId,
        organization: { id: param.organizationId }
      },
      relations: param.relations || []
    })
  }

  findAllByOrganization(param: { organizationId: string; relations?: string[] }) {
    return this.paymentLinkRepository.find({
      where: {
        organization: { id: param.organizationId }
      },
      relations: param.relations || []
    })
  }
}
