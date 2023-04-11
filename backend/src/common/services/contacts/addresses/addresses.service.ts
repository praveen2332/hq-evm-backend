import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../../core/base.service'
import { RecipientAddress } from './address.entity'

@Injectable()
export class RecipientAddressesService extends BaseService<RecipientAddress> {
  constructor(
    @InjectRepository(RecipientAddress)
    private recipientAddressesRepository: Repository<RecipientAddress>
  ) {
    super(recipientAddressesRepository)
  }
}
