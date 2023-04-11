import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { v4 } from 'uuid'
import { AuthModule } from '../auth/auth.module'
import { Organization } from '../common/services/organizations/organization.entity'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { OrganizationType } from './interfaces'
import { Account } from '../common/services/account/account.entity'
import { getConnection } from '../../test/db'
import { Role } from '../common/services/roles/role.entity'
import { RolesModule } from '../roles/roles.module'
import { AuthWallet } from '../common/services/providers/wallet.entity'
import { ProvidersModule } from '../providers/providers.module'
import { AccountsModule } from '../accounts/accounts.module'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { Group } from '../groups/group.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'
import { Transaction } from '../transactions/transaction.entity'

describe('OrganizationsController', () => {
  let organizationsController: OrganizationsController
  let connection: Connection
  const userId = '1'
  const organization1 = '1'
  const organization2 = '2'
  const organization3 = '3'
  const publicId1 = v4()
  const publicId2 = v4()
  const publicId3 = v4()
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
      AuthWallet,
      Role,
      Chain,
      Token,
      Transaction
    ])
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        RolesModule,
        AuthModule,
        ProvidersModule,
        AccountsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Organization, SourceOfFund, Account, Group, Role, AuthWallet, Chain, Token, Transaction]
        })
      ],
      controllers: [OrganizationsController],
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useClass: Repository },
        { provide: getRepositoryToken(Account), useClass: Repository },
        { provide: getRepositoryToken(Role), useClass: Repository },
        { provide: getRepositoryToken(AuthWallet), useClass: Repository }
      ]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    organizationsController = app.get<OrganizationsController>(OrganizationsController)

    await entityManager.insert(AuthWallet, {
      address: '1',
      nonce: 'nonce'
    })

    await entityManager.insert(Organization, {
      id: organization1,
      publicId: publicId1,
      type: OrganizationType.COMPANY,
      name: 'Flowstation'
    })

    await entityManager.insert(Organization, {
      id: organization2,
      publicId: publicId2,
      type: OrganizationType.COMPANY,
      name: 'Example 1'
    })

    await entityManager.insert(Organization, {
      id: organization3,
      publicId: publicId3,
      type: OrganizationType.DAO,
      name: 'Example 2'
    })

    await entityManager.insert(Account, {
      id: '1',
      name: 'Example'
    })
  })

  afterEach(() => {
    return connection.close()
  })

  describe('get organization', () => {
    it('should return an organization info', async () => {
      expect(await organizationsController.get(publicId1)).toMatchObject({
        creatorWalletAddress: '1',
        type: OrganizationType.COMPANY,
        name: 'Flowstation'
      })

      expect(await organizationsController.getMyOrganizations(req)).toHaveLength(1)
    })

    it('should return organization array', async () => {
      const result = await organizationsController.getAll({})
      expect(result).toMatchObject({
        totalItems: 3,
        totalPages: 1,
        currentPage: 0,
        limit: 10
      })
      expect(result.items).toHaveLength(3)
    })

    it('should throw an exception', async () => {
      await expect(organizationsController.get(v4())).rejects.toThrow('Not Found')
    })
  })

  describe('post organization', () => {
    it('should return an organization info', async () => {
      expect(
        await organizationsController.create(
          { name: 'Example', creatorWalletAddress: userId, type: OrganizationType.COMPANY },
          req
        )
      ).toMatchObject({
        type: OrganizationType.COMPANY,
        name: 'Example'
      })
    })
  })

  describe('put organization', () => {
    it('should return an organization info', async () => {
      expect(
        await organizationsController.update({ id: organization1, name: 'Example 1', type: OrganizationType.DAO }, req)
      ).toMatchObject({
        type: OrganizationType.DAO,
        name: 'Example 1'
      })
    })

    it('should throw an exception', async () => {
      await expect(
        organizationsController.update({ id: '4', name: 'Example 1', type: OrganizationType.DAO }, req)
      ).rejects.toThrow('Not Found')
    })
  })

  describe('delete group', () => {
    it('should delete a group', async () => {
      expect(await organizationsController.delete(organization1, req)).toBe(true)
      await expect(organizationsController.delete(organization1, req)).rejects.toThrow('Not Found')
    })
  })
})
