import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Token } from './token.entity'

@Injectable()
export class TokensService extends BaseService<Token> {
  constructor(
    @InjectRepository(Token)
    private tokensRepository: Repository<Token>
  ) {
    super(tokensRepository)
  }

  async getBySymbol(symbol: string) {
    return this.tokensRepository.findOne({ where: { name: symbol } })
  }
}
