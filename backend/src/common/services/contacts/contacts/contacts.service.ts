import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../../core/base.service'
import { ContactProvider } from './contact.entity'

@Injectable()
export class ContactProvidersService extends BaseService<ContactProvider> {
  constructor(
    @InjectRepository(ContactProvider)
    private contactProvidersRepository: Repository<ContactProvider>
  ) {
    super(contactProvidersRepository)
  }
}
