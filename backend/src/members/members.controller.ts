import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AccountId } from '../common/decorators/accountId/account-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { AccountsService } from '../common/services/account/accounts.service'
import { EntityTypeEnum, OrganizationAddressesService } from '../common/services/general/organization-addresses.service'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { Action, Resource } from '../permissions/interfaces'
import { MemberQueryParams, OrganizationParam, ProfileDto, UpdateMemberRoleDto, UpdateProfileDto } from './index'
import { MemberDomainService } from './member.domain.service'

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissionResource(Resource.MEMBERS)
@Controller()
export class MembersController {
  constructor(
    private memberDomainService: MemberDomainService,
    private organizationAddressesService: OrganizationAddressesService,
    private organizationsService: OrganizationsService,
    private accountsService: AccountsService
  ) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getAll(@Query() query: MemberQueryParams, @Param('organizationId') organizationId: string) {
    return await this.memberDomainService.getAllPagingDto(query, {
      publicOrganizationId: organizationId
    })
  }

  @Put(':id/role')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async updateRole(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe()) body: UpdateMemberRoleDto,
    @AccountId() accountId: string
  ) {
    const userMember = await this.memberDomainService.getMemberByAccount(organizationId, accountId)

    if (!userMember) {
      throw new NotFoundException(`Can not find member`)
    }

    const member = await this.memberDomainService.canUserModifyMember({
      currentUserRole: userMember.role,
      organizationId,
      memberId: id
    })

    this.memberDomainService.canUserUpdateRole({
      changeToRole: body.role,
      currentUserRole: userMember.role
    })

    return this.memberDomainService.updateRole({
      member,
      role: body.role
    })
  }

  @Delete(':id/deactivate')
  @RequirePermissionAction(Action.DELETE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async deactivate(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @AccountId() accountId: string
  ) {
    const userMember = await this.memberDomainService.getMemberByAccount(organizationId, accountId)

    if (!userMember) {
      throw new NotFoundException(`Can not find member`)
    }

    const member = await this.memberDomainService.canUserModifyMember({
      currentUserRole: userMember.role,
      organizationId,
      memberId: id
    })

    if (member.account.activeOrganizationId === organizationId) {
      const memberOrganizations = await this.organizationsService.getOrganizationsByAccountId(member.account.id)
      const newDefaultOrganization = memberOrganizations.find((o) => o.publicId !== organizationId)

      member.account = await this.accountsService.update({
        ...member.account,
        activeOrganizationId: newDefaultOrganization?.publicId || null
      })
    }

    return this.memberDomainService.deactivate(member, userMember.id)
  }

  @Post(':id/activate')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async activate(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @AccountId() accountId: string
  ) {
    const userMember = await this.memberDomainService.getMemberByAccount(organizationId, accountId)

    if (!userMember) {
      throw new NotFoundException(`Can not find member`)
    }

    const member = await this.memberDomainService.canUserModifyMember({
      currentUserRole: userMember.role,
      organizationId,
      memberId: id
    })

    if (!member.account.activeOrganizationId) {
      member.account = await this.accountsService.update({
        ...member.account,
        activeOrganizationId: organizationId
      })
    }

    return this.memberDomainService.activate(member)
  }

  @Get(':id/profile')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async getProfile(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @AccountId() accountId: string
  ) {
    const currentMember = await this.memberDomainService.getMemberByAccount(organizationId, accountId)

    if (!currentMember) {
      throw new NotFoundException(`Can not find member`)
    }

    const member = await this.memberDomainService.getProfileMember({
      currentMember,
      organizationId,
      memberId: id
    })
    return ProfileDto.map(member)
  }

  @Get('me')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getMyProfile(@Param(new ValidationPipe()) param: OrganizationParam, @AccountId() accountId: string) {
    if (!param.organizationId) {
      throw new BadRequestException('Invalid organization id')
    }
    if (!accountId) {
      throw new BadRequestException('Invalid account id')
    }

    const currentMember = await this.memberDomainService.getMemberProfileByAccount(param.organizationId, accountId)

    if (!currentMember) {
      throw new NotFoundException(`Can not find member`)
    }

    return ProfileDto.map(currentMember)
  }

  @Put(':id/profile')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async updateProfile(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe()) body: UpdateProfileDto,
    @AccountId() accountId: string
  ) {
    const currentMember = await this.memberDomainService.getMemberByAccount(organizationId, accountId)

    if (!currentMember) {
      throw new NotFoundException(`Can not find member`)
    }

    for (const wallet of body.addresses) {
      const validationResponse = await this.organizationAddressesService.getAddressLocation(
        wallet.address,
        wallet.blockchainId,
        currentMember.organization.id
      )

      if (!!validationResponse) {
        throw new BadRequestException(`This address exists in '${validationResponse.message}'.`)
      }
    }

    const member = await this.memberDomainService.getProfileMember({
      currentMember,
      organizationId,
      memberId: id
    })

    return this.memberDomainService.updateProfile(member, body)
  }

  @Put('me')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async updateMyProfile(
    @Param('organizationId') organizationId: string,
    @Body(new ValidationPipe()) body: UpdateProfileDto,
    @AccountId() accountId: string
  ) {
    const currentMember = await this.memberDomainService.getMemberProfileByAccount(organizationId, accountId)

    if (!currentMember) {
      throw new NotFoundException(`Can not find member`)
    }

    for (const wallet of body.addresses) {
      const validationResponse = await this.organizationAddressesService.getAddressLocation(
        wallet.address,
        wallet.blockchainId,
        currentMember.organization.id
      )

      if (validationResponse?.isNotNewOrSame(currentMember.profile, EntityTypeEnum.MEMBERS)) {
        throw new BadRequestException(`This address exists in '${validationResponse.message}'.`)
      }
    }

    return this.memberDomainService.updateProfile(currentMember, body)
  }
}
