import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { AuthModule } from '../auth/auth.module'
import { Role } from '../common/services/roles/role.entity'
import { RolesController } from './roles.controller'
import { RolesService } from '../common/services/roles/roles.service'
import { getConnection } from '../../test/db'
import { Account } from '../common/services/account/account.entity'
import { OrganizationsModule } from '../organizations/organizations.module'
import { Organization } from '../common/services/organizations/organization.entity'
import { ERole } from './interfaces'
import { AuthWallet } from '../common/services/providers/wallet.entity'
import { AccountsModule } from '../accounts/accounts.module'
import { ProvidersModule } from '../providers/providers.module'
import { Chain } from '../common/services/chains/chain.entity'
import { Token } from '../common/services/tokens/token.entity'
import { Group } from '../groups/group.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'
import { Transaction } from '../transactions/transaction.entity'

describe('RolesController', () => {
  let rolesController: RolesController
  let rolesService: RolesService
  let connection: Connection
  const userId = '1'
  const organizationId = '1'
  const role1 = '1'
  const role2 = '2'
  const role3 = '3'
  const req = {
    user: {
      id: userId,
      address: '1'
    }
  }

  beforeEach(async () => {
    connection = await getConnection([
      Role,
      SourceOfFund,
      Account,
      Organization,
      AuthWallet,
      Chain,
      Token,
      Group,
      Transaction
    ])
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        OrganizationsModule,
        AccountsModule,
        ProvidersModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Role, SourceOfFund, Account, Organization, AuthWallet, Chain, Token, Group, Transaction]
        })
      ],
      controllers: [RolesController],
      providers: [RolesService, { provide: getRepositoryToken(Role), useClass: Repository }]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    const entityManager = connection.createEntityManager()

    rolesController = app.get<RolesController>(RolesController)
    rolesService = app.get<RolesService>(RolesService)

    await entityManager.insert(Role, {
      id: role1,
      name: ERole.Owner,
      permissions: []
    })

    await entityManager.insert(Role, {
      id: role2,
      name: ERole.Admin,
      permissions: []
    })

    await entityManager.insert(Role, {
      id: role3,
      name: ERole.Employee,
      permissions: []
    })
  })

  afterEach(() => {
    return connection.close()
  })

  describe('get role', () => {
    it('should return a role info', async () => {
      const role = await rolesService.get(role1)
      expect(await rolesController.get(role1)).toMatchObject({ ...role })
    })

    it('should throw an exception', async () => {
      await expect(rolesController.get('4')).rejects.toThrow('Not Found')
    })

    it('should return role array', async () => {
      const result = await rolesController.getAll({})
      expect(result).toMatchObject({
        totalItems: 3,
        totalPages: 1,
        currentPage: 0,
        limit: 10
      })
      expect(result.items).toHaveLength(3)
    })
  })

  describe('post role', () => {
    it('should return a role info', async () => {
      expect(
        await rolesController.create({
          name: ERole.Auditor,
          permissions: []
        })
      ).toMatchObject({
        name: ERole.Auditor
      })
    })

    it('should throw an exception', async () => {
      await expect(
        rolesController.create({
          name: ERole.Admin,
          permissions: []
        })
      ).rejects.toThrow('role is already exist')
    })
  })

  describe('put role', () => {
    it('should return a role info', async () => {
      expect(
        await rolesController.update({
          id: '1',
          name: ERole.Vendor,
          permissions: []
        })
      ).toMatchObject({
        name: ERole.Vendor
      })
    })

    it('should throw an exception', async () => {
      await expect(
        rolesController.update({
          id: role1,
          name: ERole.Admin,
          permissions: []
        })
      ).rejects.toThrow('role is already exist')

      await expect(
        rolesController.update({
          id: role1,
          name: null,
          permissions: []
        })
      ).rejects.toThrow('Internal Server Error')

      await expect(
        rolesController.update({
          id: '4',
          name: ERole.Admin,
          permissions: []
        })
      ).rejects.toThrow('Not Found')
    })
  })

  describe('delete role', () => {
    it('should delete a role', async () => {
      expect(await rolesController.delete(role2)).toBe(true)
      await expect(rolesController.delete(role2)).rejects.toThrow('Not Found')
    })
  })
})
