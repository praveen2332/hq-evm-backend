import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../core/base.service'
import { SourceCdc } from './source-cdc.entity'

@Injectable()
export class SourceCdcService extends BaseService<SourceCdc> {
  constructor(
    @InjectRepository(SourceCdc)
    private sourceCdcRepository: Repository<SourceCdc>
  ) {
    super(sourceCdcRepository)
  }
}
