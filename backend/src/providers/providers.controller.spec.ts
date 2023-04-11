import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { AuthModule } from '../auth/auth.module'
import { AuthWallet } from '../common/services/providers/wallet.entity'
import { ProvidersController } from './providers.controller'
import { WalletsService } from '../common/services/providers/wallets.service'
import { v4 } from 'uuid'
import { SignMessage } from '../common/constants'
import { getConnection } from '../../test/db'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { Transaction } from '../transactions/transaction.entity'
import { Organization } from '../common/services/organizations/organization.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'
import { Account } from '../common/services/account/account.entity'
import { Role } from '../common/services/roles/role.entity'
import { Group } from '../groups/group.entity'

describe('WalletsController', () => {
  let walletsController: ProvidersController
  let walletsService: WalletsService
  let connection: Connection

  beforeEach(async () => {
    connection = await getConnection([
      Transaction,
      Organization,
      SourceOfFund,
      Account,
      Role,
      AuthWallet,
      Chain,
      Token,
      Group
    ])

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Transaction, Organization, SourceOfFund, Account, Role, AuthWallet, Chain, Token, Group]
        })
      ],
      controllers: [ProvidersController],
      providers: [WalletsService, { provide: getRepositoryToken(AuthWallet), useClass: Repository }]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    walletsController = app.get<ProvidersController>(ProvidersController)
    walletsService = app.get<WalletsService>(WalletsService)

    await entityManager.insert(AuthWallet, {
      address: '1',
      nonce: v4()
    })
    await entityManager.insert(AuthWallet, {
      address: '2',
      nonce: v4()
    })
    await entityManager.insert(AuthWallet, {
      address: '3',
      nonce: v4()
    })
  })

  afterEach(() => {
    return connection.close()
  })

  describe('get wallet', () => {
    it('should return an wallet info', async () => {
      const wallet = await walletsService.findOneByAddress('1')
      expect(await walletsController.get('1')).toMatchObject({
        address: '1',
        nonce: `${SignMessage} (${wallet.nonce})`
      })

      expect(await walletsController.post({ address: '4' })).toMatchObject({
        address: '4'
      })
    })
  })
})
