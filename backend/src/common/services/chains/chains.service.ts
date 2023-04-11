import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Chain } from './chain.entity'

@Injectable()
export class ChainsService extends BaseService<Chain> {
  constructor(
    @InjectRepository(Chain)
    private chainsRepository: Repository<Chain>
  ) {
    super(chainsRepository)
  }
}
