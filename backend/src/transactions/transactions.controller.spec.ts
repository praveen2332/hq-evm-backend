import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { Transaction } from './transaction.entity'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { v4 } from 'uuid'
import { getConnection } from '../../test/db'
import { OrganizationsModule } from '../organizations/organizations.module'
import { Organization } from '../common/services/organizations/organization.entity'
import { TransactionsModule } from './transactions.module'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { Account } from '../common/services/account/account.entity'
import { Role } from '../common/services/roles/role.entity'
import { Wallet } from '../common/services/providers/wallet.entity'
import { Group } from '../groups/group.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'

describe('TransactionsController', () => {
  let transactionsController: TransactionsController
  let transactionsService: TransactionsService
  let connection: Connection
  const transaction1 = v4()
  const transaction2 = v4()
  const transaction3 = v4()
  const safeAddress = v4()
  const hash1 = v4()
  const hash2 = v4()
  const hash3 = v4()
  const chainId = 4

  beforeEach(async () => {
    connection = await getConnection([
      Transaction,
      Organization,
      SourceOfFund,
      Account,
      Role,
      Wallet,
      Chain,
      Token,
      Group
    ])
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        TransactionsModule,
        OrganizationsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Transaction, Organization, SourceOfFund, Account, Role, Wallet, Chain, Token, Group]
        })
      ],
      controllers: [TransactionsController],
      providers: [TransactionsService, { provide: getRepositoryToken(Transaction), useClass: Repository }]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    transactionsController = app.get<TransactionsController>(TransactionsController)
    transactionsService = app.get<TransactionsService>(TransactionsService)
  })

  afterEach(() => {
    return connection.close()
  })

  it('should be defined', () => {
    expect(transactionsController).toBeDefined()
  })

  // describe('get transaction', () => {
  //   it('should return a transaction info', async () => {
  //     const transaction = await transactionsService.findOne(transaction1)
  //     expect(await transactionsController.get(safeAddress, chainId, hash1)).toMatchObject({ ...transaction })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(transactionsController.get(safeAddress, chainId, v4())).rejects.toThrow('Not Found')
  //   })

  //   it('should return transaction array', async () => {
  //     const result = await transactionsController.getAll(v4(), safeAddress, chainId, {})
  //     expect(result).toMatchObject({
  //       totalItems: 3,
  //       totalPages: 1,
  //       currentPage: 0,
  //       limit: 10
  //     })
  //     expect(result.items).toHaveLength(3)

  //     // @TODO
  //     // const res = await transactionsController.getAll({}, organizationId, group1)
  //     // expect(res).toMatchObject({
  //     //   totalItems: 2,
  //     //   totalPages: 1,
  //     //   currentPage: 0,
  //     //   limit: 10
  //     // })
  //     // expect(res.items).toHaveLength(2)
  //   })
  // })

  // describe('post transaction', () => {
  //   it('should return a transaction info', async () => {
  //     const hash4 = v4()
  //     expect(
  //       await transactionsController.create({
  //         chainId: 4,
  //         safeHash: hash4,
  //         safeAddress,
  //         comments: ['tag1', 'tag2'],
  //         description: 'description'
  //       })
  //     ).toMatchObject({
  //       chainId: 4,
  //       safeHash: hash4,
  //       safeAddress,
  //       comments: ['tag1', 'tag2'],
  //       description: 'description'
  //     })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(
  //       transactionsController.create({
  //         chainId: 4,
  //         safeHash: null,
  //         safeAddress,
  //         comments: ['tag1', 'tag2'],
  //         description: 'description'
  //       })
  //     ).rejects.toThrow('Internal Server Error')
  //   })
  // })
})
