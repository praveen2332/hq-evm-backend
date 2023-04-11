import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Token } from '../common/services/tokens/token.entity'
import { PaymentLinksController } from './payment-links.controller'
import { TokensService } from '../common/services/tokens/tokens.service'

describe('TokensController', () => {
  let controller: PaymentLinksController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentLinksController],
      providers: [TokensService, { provide: getRepositoryToken(Token), useClass: Repository }]
    }).compile()

    controller = module.get<PaymentLinksController>(PaymentLinksController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
