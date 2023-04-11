import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { AuthModule } from '../auth/auth.module'
import { Group } from './group.entity'
import { GroupsController } from './groups.controller'
import { GroupsService } from './groups.service'
import { v4 } from 'uuid'
import { getConnection } from '../../test/db'
import { Account } from '../common/services/account/account.entity'
import { OrganizationsModule } from '../organizations/organizations.module'
import { Organization } from '../common/services/organizations/organization.entity'
import { Role } from '../common/services/roles/role.entity'
import { AccountsModule } from '../accounts/accounts.module'
import { ProvidersModule } from '../providers/providers.module'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'
import { Transaction } from '../transactions/transaction.entity'

describe('GroupsController', () => {
  let groupsController: GroupsController
  let groupsService: GroupsService
  let connection: Connection
  const userId = v4()
  const organizationId = v4()
  const group1 = v4()
  const group2 = v4()
  const group3 = v4()
  const req = {
    user: {
      id: userId,
      address: '1'
    }
  }

  beforeEach(async () => {
    connection = await getConnection([Group, Account, Role, Chain, Token, Organization, SourceOfFund, Transaction])
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        OrganizationsModule,
        AccountsModule,
        ProvidersModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Group, Account, Chain, Token, Role, Organization, SourceOfFund, Transaction]
        })
      ],
      controllers: [GroupsController],
      providers: [GroupsService, { provide: getRepositoryToken(Group), useClass: Repository }]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    groupsController = app.get<GroupsController>(GroupsController)
    groupsService = app.get<GroupsService>(GroupsService)

    await entityManager.insert(Group, {
      id: group1,
      organizationId,
      name: 'Group 1',
      description: 'Group 1'
    })

    await entityManager.insert(Group, {
      id: group2,
      organizationId,
      name: 'Group 2',
      description: 'Group 2'
    })

    await entityManager.insert(Group, {
      id: group3,
      organizationId,
      name: 'Group 3',
      description: 'Group 3'
    })
  })

  afterEach(() => {
    return connection.close()
  })

  it('should be defined', () => {
    expect(groupsController).toBeDefined()
  })

  // describe('get group', () => {
  //   it('should return a group info', async () => {
  //     const group = await groupsService.findOne(group1)
  //     expect(await groupsController.get(group1)).toMatchObject({ ...group })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(groupsController.get(v4())).rejects.toThrow('Not Found')
  //   })

  //   it('should return group array', async () => {
  //     const result = await groupsController.getAll({}, organizationId)
  //     expect(result).toMatchObject({
  //       totalItems: 3,
  //       totalPages: 1,
  //       currentPage: 0,
  //       limit: 10
  //     })
  //     expect(result.items).toHaveLength(3)
  //   })
  // })

  // describe('post group', () => {
  //   it('should return a group info', async () => {
  //     expect(
  //       await groupsController.create(
  //         {
  //           name: 'Group 4',
  //           description: 'Group 4'
  //         },
  //         {
  //           organizationId
  //         }
  //       )
  //     ).toMatchObject({
  //       name: 'Group 4',
  //       description: 'Group 4',
  //       organizationId
  //     })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(
  //       groupsController.create(
  //         {
  //           name: 'Group 1',
  //           description: 'Group 1'
  //         },
  //         {
  //           organizationId
  //         }
  //       )
  //     ).rejects.toThrow('group is already exist')

  //     await expect(
  //       groupsController.create(
  //         {
  //           name: undefined,
  //           description: '1'
  //         },
  //         {
  //           organizationId: '1'
  //         }
  //       )
  //     ).rejects.toThrow('Internal Server Error')
  //   })
  // })

  // describe('put group', () => {
  //   it('should return a group info', async () => {
  //     expect(
  //       await groupsController.update({
  //         id: group1,
  //         name: 'Example',
  //         description: '2'
  //       })
  //     ).toMatchObject({
  //       name: 'Example',
  //       description: '2'
  //     })
  //   })

  //   it('should throw an exception', async () => {
  //     await expect(
  //       groupsController.update({
  //         id: group1,
  //         name: 'Group 2',
  //         description: 'Group 2'
  //       })
  //     ).rejects.toThrow('group is already exist')

  //     await expect(
  //       groupsController.update({
  //         id: 1,
  //         name: 'Example',
  //         description: ''
  //       })
  //     ).rejects.toThrow('Internal Server Error')

  //     await expect(
  //       groupsController.update({
  //         id: v4(),
  //         name: 'Example',
  //         description: ''
  //       })
  //     ).rejects.toThrow('Not Found')
  //   })
  // })

  // describe('delete group', () => {
  //   it('should delete a group', async () => {
  //     expect(await groupsController.delete(group2)).toBe(true)
  //     await expect(groupsController.delete(group2)).rejects.toThrow('Not Found')
  //   })
  // })
})
