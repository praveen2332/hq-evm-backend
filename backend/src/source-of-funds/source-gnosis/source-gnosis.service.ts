import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../core/base.service'
import { SourceGnosis } from './source-gnosis.entity'

@Injectable()
export class SourceGnosisService extends BaseService<SourceGnosis> {
  constructor(
    @InjectRepository(SourceGnosis)
    private sourceGnosisRepository: Repository<SourceGnosis>
  ) {
    super(sourceGnosisRepository)
  }
}
