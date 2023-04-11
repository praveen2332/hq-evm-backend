import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Token } from '../common/services/tokens/token.entity'
import { TokensController } from './tokens.controller'
import { TokensService } from '../common/services/tokens/tokens.service'

describe('TokensController', () => {
  let controller: TokensController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [TokensService, { provide: getRepositoryToken(Token), useClass: Repository }]
    }).compile()

    controller = module.get<TokensController>(TokensController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
