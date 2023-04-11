import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { AuthTwitter } from './twitter.entity'

@Injectable()
export class TwitterService extends BaseService<AuthTwitter> {
  constructor(
    @InjectRepository(AuthTwitter)
    private twitterRepository: Repository<AuthTwitter>
  ) {
    super(twitterRepository)
  }

  add(twitterAccount: AuthTwitter): Promise<AuthTwitter> {
    return this.twitterRepository.save(twitterAccount)
  }

  findOneByEmail(email: string): Promise<AuthTwitter> {
    return this.twitterRepository.findOne({ where: { email } })
  }
}
