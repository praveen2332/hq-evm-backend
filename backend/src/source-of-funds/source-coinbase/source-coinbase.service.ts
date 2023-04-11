import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../core/base.service'
import { SourceCoinbase } from './source-coinbase.entity'

@Injectable()
export class SourceCoinbaseService extends BaseService<SourceCoinbase> {
  constructor(
    @InjectRepository(SourceCoinbase)
    private sourceCoinbaseRepository: Repository<SourceCoinbase>
  ) {
    super(sourceCoinbaseRepository)
  }
}
