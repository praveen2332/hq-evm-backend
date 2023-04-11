import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../core/base.service'
import { SourceEth } from './source-eth-eoa.entity'

@Injectable()
export class SourceEthService extends BaseService<SourceEth> {
  constructor(
    @InjectRepository(SourceEth)
    private sourceEthRepository: Repository<SourceEth>
  ) {
    super(sourceEthRepository)
  }
}
