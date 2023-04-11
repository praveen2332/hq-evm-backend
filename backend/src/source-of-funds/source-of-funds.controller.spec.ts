import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Connection } from 'typeorm'
import { AuthModule } from '../auth/auth.module'
import { SourceOfFundsController } from './source-of-funds.controller'
import { SourceOfFundsService } from './source-of-funds.service'
import { v4 } from 'uuid'
import { getConnection } from '../../test/db'
import { Account } from '../common/services/account/account.entity'
import { AccountsModule } from '../accounts/accounts.module'
import { SourceOfFundsModule } from './source-of-funds.module'
import { Organization } from '../common/services/organizations/organization.entity'
import { OrganizationsModule } from '../organizations/organizations.module'
import { Role } from '../common/services/roles/role.entity'
import { Wallet } from '../common/services/providers/wallet.entity'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { Group } from '../groups/group.entity'
import { SourceOfFund } from './source-of-fund.entity'
import { Transaction } from '../transactions/transaction.entity'

describe('SourceOfFundsController', () => {
  let sourcesController: SourceOfFundsController
  let sourcesService: SourceOfFundsService
  let connection: Connection
  const userId = v4()
  const organizationId = v4()
  const source1 = v4()
  const source2 = v4()
  const source3 = v4()
  const req = {
    user: {
      id: userId,
      address: '1'
    }
  }

  beforeEach(async () => {
    connection = await getConnection([
      Organization,
      SourceOfFund,
      Account,
      Group,
      Role,
      Wallet,
      Chain,
      Token,
      Transaction
    ])
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        AccountsModule,
        SourceOfFundsModule,
        OrganizationsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Organization, SourceOfFund, Account, Group, Role, Wallet, Chain, Token, Transaction]
        })
      ],
      controllers: [SourceOfFundsController],
      providers: [SourceOfFundsService]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    sourcesController = app.get<SourceOfFundsController>(SourceOfFundsController)
    sourcesService = app.get<SourceOfFundsService>(SourceOfFundsService)
  })

  afterEach(() => {
    return connection.close()
  })

  it('should be defined', () => {
    expect(sourcesController).toBeDefined()
  })

  // describe('get source', () => {
  //   it('should return a source info', async () => {
  //     const source = await sourcesService.findOne(source1)
  //     expect(await sourcesController.get(source1)).toMatchObject({ ...source })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(sourcesController.get(v4())).rejects.toThrow('Not Found')
  //   })

  //   it('should return source array', async () => {
  //     const result = await sourcesController.getAll({}, organizationId)
  //     expect(result).toMatchObject({
  //       totalItems: 3,
  //       totalPages: 1,
  //       currentPage: 0,
  //       limit: 10
  //     })
  //     expect(result.items).toHaveLength(3)
  //   })
  // })

  // describe('post source', () => {
  //   it('should return a source info', async () => {
  //     expect(
  //       await sourcesController.create({
  //         name: 'Source 4',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).toMatchObject({
  //       name: 'Source 4'
  //     })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(
  //       sourcesController.create({
  //         name: 'Source 1',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).rejects.toThrow('source is already exist')

  //     await expect(
  //       sourcesController.create({
  //         name: undefined,
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).rejects.toThrow('Internal Server Error')
  //   })
  // })

  // describe('put source', () => {
  //   it('should return a source info', async () => {
  //     expect(
  //       await sourcesController.update({
  //         id: source1,
  //         name: 'Example',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).toMatchObject({
  //       name: 'Example'
  //     })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(
  //       sourcesController.update({
  //         id: source1,
  //         name: 'Source 2',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).rejects.toThrow('source is already exist')

  //     await expect(
  //       sourcesController.update({
  //         id: '1',
  //         name: 'Example',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).rejects.toThrow('Internal Server Error')

  //     await expect(
  //       sourcesController.update({
  //         id: v4(),
  //         name: 'Example',
  //         organizationId,
  //         apiKey: 'apiKey',
  //         secretKey: 'secretKey',
  //         limitTransfer: '1'
  //       })
  //     ).rejects.toThrow('Not Found')
  //   })
  // })

  // describe('delete source', () => {
  //   it('should delete a source', async () => {
  //     expect(await sourcesController.delete(source2)).toBe(true)
  //     await expect(sourcesController.delete(source2)).rejects.toThrow('Not Found')
  //   })
  // })
})
