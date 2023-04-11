import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Blockchain } from './blockchain.entity'

@Injectable()
export class BlockchainsService extends BaseService<Blockchain> {
  constructor(
    @InjectRepository(Blockchain)
    private blockchainsRepository: Repository<Blockchain>
  ) {
    super(blockchainsRepository)
  }

  getEnabledBlockchains() {
    // Cache query for 1 minute
    return this.blockchainsRepository.find({ where: { isEnabled: true }, cache: 60000 })
  }

  async getEnabledBlockchainPublicIds() {
    // Cache query for 1 minute
    const blockchains = await this.blockchainsRepository.find({ where: { isEnabled: true }, cache: 60000 })
    return blockchains?.map((bc) => bc.publicId)
  }
}
