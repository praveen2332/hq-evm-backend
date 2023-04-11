import { Test, TestingModule } from '@nestjs/testing'
import { InvitationsController } from './invitations.controller'
import { InvitationsService } from '../common/services/invitations/invitations.service'
import { RolesService } from '../common/services/roles/roles.service'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { CanActivate, NotFoundException } from '@nestjs/common'
import { CreateInvitationDto, InvitationStatus } from './interface'
import { invitationMocks } from '../../test/mock/invitation.mock'
import { rolesMock } from '../../test/mock/roles.mock'
import { Invitation } from '../common/services/invitations/invitation.entity'
import { organizationMocks } from '../../test/mock/organization.mock'
import { PaginationResponse } from '../core/interfaces'
import { jwtMock } from '../../test/mock/jwt.mock'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WalletsService } from '../common/services/providers/wallets.service'
import { EmailService } from '../common/services/providers/email.service'
import { MembersService } from '../common/services/members/members.service'
import { AccountsService } from '../common/services/account/accounts.service'
import clearAllMocks = jest.clearAllMocks
import { LoggerService } from '../common/logger/logger.service'

describe('InvitationController', () => {
  let controller: InvitationsController

  const invitationsMockService = {
    findOne: jest.fn(),
    findActiveInvite: jest.fn(),
    getAllPaging: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }

  const organizationAuthMockService = {
    createNewMember: jest.fn()
  }

  const organizationsMockService = {
    findByPublicId: jest.fn()
  }

  const rolesMockService = {
    findOne: jest.fn()
  }

  const accountsMockService = {
    findOne: jest.fn()
  }

  const walletsMockService = {
    findAvailableWallet: jest.fn()
  }
  const emailMockService = {
    findOneByEmail: jest.fn()
  }

  const memberProfileMockService = {
    getByOrganizationIdAndEmail: jest.fn(),
    getByOrganizationIdAndAddress: jest.fn()
  }

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(new Date())
  })

  beforeEach(async () => {
    const mock_PermissionsGuard: CanActivate = { canActivate: jest.fn(() => true) }
    const mock_JwtAuthGuard: CanActivate = { canActivate: jest.fn(() => true) }

    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: invitationsMockService
        },
        {
          provide: RolesService,
          useValue: rolesMockService
        },
        {
          provide: OrganizationsService,
          useValue: organizationsMockService
        },
        {
          provide: MembersService,
          useValue: organizationAuthMockService
        },
        {
          provide: WalletsService,
          useValue: walletsMockService
        },
        {
          provide: EmailService,
          useValue: emailMockService
        },
        {
          provide: AccountsService,
          useValue: accountsMockService
        },
        {
          provide: LoggerService,
          useValue: {}
        }
      ]
    })
      .overrideGuard(PermissionsGuard)
      .useValue(mock_PermissionsGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mock_JwtAuthGuard)
      .compile()

    controller = module.get<InvitationsController>(InvitationsController)
    clearAllMocks()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('Create invitation', () => {
    it('invite by email - success', async () => {
      const dto = new CreateInvitationDto()
      const invitationMock = invitationMocks.inviteByEmailMock
      dto.email = invitationMock.email
      dto.firstName = invitationMock.firstName
      dto.lastName = invitationMock.lastName
      dto.role = invitationMock.role.name

      invitationsMockService.findOne.mockReturnValue(null)
      organizationsMockService.findByPublicId.mockReturnValue(invitationMock.organization)
      rolesMockService.findOne.mockReturnValue(rolesMock.employeeMock)
      invitationsMockService.create.mockImplementation(async (par) => par)

      const invitation = await controller.create(
        invitationMock.organization.publicId,
        dto,
        jwtMock.validAddress.accountId
      )
      expect(invitation.email).toEqual(dto.email)
      expect(invitation.firstName).toEqual(dto.firstName)
      expect(invitation.lastName).toEqual(dto.lastName)
      expect(invitation.address == null).toBe(true)
      expect(invitation.role.name).toEqual(dto.role)
      expect(invitation.organization.publicId).toEqual(invitationMock.organization.publicId)
      expect(invitation.status).toEqual(InvitationStatus.INVITED)
      expect(invitation.publicId).not.toBe(null)
      expect(invitation.expiredAt.getTime() - invitation.createdAt.getTime()).toEqual(3600000 * 24)
    })

    it('invite by wallet - success', async () => {
      const dto = new CreateInvitationDto()
      const invitationMock = invitationMocks.inviteByWalletMock
      dto.address = invitationMock.address
      dto.firstName = invitationMock.firstName
      dto.lastName = invitationMock.lastName
      dto.role = invitationMock.role.name

      invitationsMockService.findOne.mockReturnValue(null)
      organizationsMockService.findByPublicId.mockReturnValue(invitationMock.organization)
      rolesMockService.findOne.mockReturnValue(rolesMock.employeeMock)
      invitationsMockService.create.mockImplementation(async (par) => par)

      const invitation = await controller.create(
        invitationMock.organization.publicId,
        dto,
        jwtMock.validAddress.accountId
      )
      expect(invitation.email == null).toBe(true)
      expect(invitation.firstName).toEqual(dto.firstName)
      expect(invitation.lastName).toEqual(dto.lastName)
      expect(invitation.address).toEqual(dto.address.toLowerCase())
      expect(invitation.role.name).toEqual(dto.role)
      expect(invitation.organization.publicId).toEqual(invitationMock.organization.publicId)
      expect(invitation.status).toEqual(InvitationStatus.INVITED)
      expect(invitation.publicId).not.toBe(null)
      expect(invitation.expiredAt.getTime() - invitation.createdAt.getTime()).toEqual(3600000 * 24)
    })
  })

  describe('Validate invitation', () => {
    it('Success', async () => {
      const invitationMock = invitationMocks.inviteByWalletMock

      const findOneSpy = jest.spyOn(invitationsMockService, 'findOne')
      invitationsMockService.findOne.mockReturnValue(invitationMock)

      const req = {
        user: jwtMock.validAddress
      }

      const invitation = await controller.checkToken(invitationMock.organization.publicId, invitationMock.publicId, req)

      expect(invitationMock).toStrictEqual(invitation)
      // expect(findOneSpy).toHaveBeenNthCalledWith(1, {
      //   relations: ['organization', 'role'],
      //   where: {
      //     address: jwtMock.validAddress.address,
      //     organization: {
      //       publicId: invitationMock.organization.publicId
      //     },
      //     publicId: invitationMock.publicId,
      //     status: InvitationStatus.INVITED
      //   }
      // })
    })

    it('Not found', async () => {
      const invitationMock = invitationMocks.inviteByWalletMock

      invitationsMockService.findOne.mockReturnValue(null)

      const req = {
        user: jwtMock.validAddress
      }
      const execution = async () => {
        await controller.checkToken(invitationMock.organization.publicId, invitationMock.publicId, req)
      }

      await expect(execution).rejects.toThrow(NotFoundException)
    })

    it('Expired', async () => {
      const invitationMock = invitationMocks.inviteByWalletMock

      invitationsMockService.findOne.mockReturnValue(<Invitation>{
        ...invitationMock,
        expiredAt: new Date(`2022-11-10`)
      })

      const req = {
        user: jwtMock.validAddress
      }

      const execution = async () => {
        await controller.checkToken(invitationMock.organization.publicId, invitationMock.publicId, req)
      }

      await expect(execution).rejects.toThrow(NotFoundException)
    })
  })

  describe('Get all', () => {
    it('Success', async () => {
      const organizationMock = organizationMocks.organizationMock
      const value: PaginationResponse<Invitation> = {
        currentPage: 1,
        limit: 100,
        totalPages: 1,
        totalItems: 1,
        items: [invitationMocks.inviteByWalletMock]
      }
      const getAllPaging = jest.spyOn(invitationsMockService, 'getAllPaging')
      invitationsMockService.getAllPaging.mockReturnValue(value)

      const invitations = await controller.getAll(
        {
          direction: 'ASC'
        },
        organizationMock.publicId
      )

      expect(value).toStrictEqual(invitations)
      expect(getAllPaging).toHaveBeenNthCalledWith(
        1,
        { direction: 'ASC' },
        [],
        { organization: { publicId: organizationMock.publicId } },
        ['organization', 'role']
      )
    })
  })

  describe('Confirm', () => {
    it('Success', async () => {
      const invitationMock = invitationMocks.inviteByWalletMock

      const req = {
        user: jwtMock.validAddress
      }

      const updateSpy = jest.spyOn(invitationsMockService, 'update')
      const memberCreateSpy = jest.spyOn(organizationAuthMockService, 'createNewMember')
      invitationsMockService.findOne.mockReturnValue(invitationMock)

      await controller.confirm(invitationMock.organization.publicId, invitationMock.publicId, req, {
        contactEmail: null,
        lastName: null,
        firstName: null
      })
      expect(updateSpy).toHaveBeenNthCalledWith(1, <Invitation>{
        ...invitationMock,
        deletedAt: new Date(),
        status: InvitationStatus.ACTIVE
      })
      expect(memberCreateSpy).toHaveBeenNthCalledWith(1, {
        member: {
          organization: invitationMock.organization,
          role: invitationMock.role
        }
      })
    })
  })
})
