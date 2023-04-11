import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../../core/base.service'
import { MemberContact } from './member-contact.entity'

@Injectable()
export class MemberContactsService extends BaseService<MemberContact> {
  constructor(
    @InjectRepository(MemberContact)
    private memberContactRepository: Repository<MemberContact>
  ) {
    super(memberContactRepository)
  }
}
