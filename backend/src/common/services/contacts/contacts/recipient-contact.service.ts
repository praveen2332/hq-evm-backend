import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../../core/base.service'
import { RecipientContact } from './recipient-contact.entity'

@Injectable()
export class RecipientContactsService extends BaseService<RecipientContact> {
  constructor(
    @InjectRepository(RecipientContact)
    private recipientContactsRepository: Repository<RecipientContact>
  ) {
    super(recipientContactsRepository)
  }
}
