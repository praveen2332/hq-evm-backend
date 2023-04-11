import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { MemberProfile } from './member-profile.entity'

@Injectable()
export class MemberProfileService extends BaseService<MemberProfile> {
  constructor(
    @InjectRepository(MemberProfile)
    private memberProfileRepository: Repository<MemberProfile>
  ) {
    super(memberProfileRepository)
  }
}
