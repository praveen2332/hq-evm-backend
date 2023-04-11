import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiOkResponsePaginated } from '../common/decorators/api.decorator'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { LoggerService } from '../common/logger/logger.service'
import { Action, Resource } from '../permissions/interfaces'
import { CreateWalletGroupDto, UpdateWalletGroupDto, WalletGroupDto, WalletGroupListDto } from './interfaces'
import { WalletGroupsDomainService } from './wallet-groups.domain.service'

@ApiTags('wallet-groups')
@ApiBearerAuth()
@RequirePermissionResource(Resource.WALLET_GROUPS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class WalletGroupsController {
  constructor(private logger: LoggerService, private walletGroupDomainService: WalletGroupsDomainService) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponsePaginated(WalletGroupDto)
  async getAll(@OrganizationId() organizationId: string) {
    return this.walletGroupDomainService.getAll(organizationId)
  }

  @Get('list')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse({ type: [WalletGroupListDto] })
  async getList(@OrganizationId() organizationId: string) {
    return this.walletGroupDomainService.getList(organizationId)
  }

  @Get(':publicId')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: WalletGroupDto })
  async get(@Param('publicId') publicId: string, @OrganizationId() organizationId: string) {
    return await this.walletGroupDomainService.getByOrganizationAndPublicId(publicId, organizationId)
  }

  @Put(':publicId')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: WalletGroupDto })
  async updateSource(
    @Param('publicId') publicId: string,
    @OrganizationId() organizationId: string,
    @Body() data: UpdateWalletGroupDto
  ) {
    return await this.walletGroupDomainService.update(publicId, organizationId, data)
  }

  @Post()
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse({ type: WalletGroupDto })
  async createWallet(@Body() data: CreateWalletGroupDto, @OrganizationId() organizationId: string) {
    return await this.walletGroupDomainService.create(organizationId, data)
  }

  @Delete(':id')
  @RequirePermissionAction(Action.DELETE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: Boolean })
  async delete(@Param('id') publicId: string, @OrganizationId() organizationId: string) {
    return await this.walletGroupDomainService.delete(publicId, organizationId)
  }
}
