import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../core/base.service'
import { SourceFtx } from './source-ftx.entity'

@Injectable()
export class SourceFtxService extends BaseService<SourceFtx> {
  constructor(
    @InjectRepository(SourceFtx)
    private sourceFtxRepository: Repository<SourceFtx>
  ) {
    super(sourceFtxRepository)
  }
}
