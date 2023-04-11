import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiOkResponsePaginated } from '../common/decorators/api.decorator'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { LoggerService } from '../common/logger/logger.service'
import { TaskSyncType } from '../core/events/event-types'
import { Action, Resource } from '../permissions/interfaces'
import { CreateWalletDto, UpdateWalletDto, WalletDto, WalletQueryParams } from './interfaces'
import { WalletsDomainService } from './wallets.domain.service'

@ApiTags('wallets')
@ApiBearerAuth()
@RequirePermissionResource(Resource.WALLETS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class WalletsController {
  constructor(private logger: LoggerService, private readonly walletsDomainService: WalletsDomainService) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponsePaginated(WalletDto)
  async getAll(@OrganizationId() organizationId: string, @Query() query: WalletQueryParams) {
    return this.walletsDomainService.getAllPaging(organizationId, query)
  }

  @Get(':publicId')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: WalletDto })
  async get(@Param('publicId') publicId: string, @OrganizationId() organizationId: string) {
    const walletDto = await this.walletsDomainService.getByOrganizationAndPublicId(publicId, organizationId)
    if (walletDto) {
      return walletDto
    }
    throw new NotFoundException('Wallet not found')
  }

  @Put(':publicId')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ type: WalletDto })
  async updateWallet(
    @Param('publicId') publicId: string,
    @OrganizationId() organizationId: string,
    @Body() dto: UpdateWalletDto
  ) {
    return await this.walletsDomainService.update(publicId, organizationId, dto)
  }

  @Post()
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse({ type: WalletDto })
  async createWallet(@Body() data: CreateWalletDto, @OrganizationId() organizationId: string) {
    return await this.walletsDomainService.create(organizationId, data)
  }

  @Post(':publicId/sync')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async syncWallet(@OrganizationId() organizationId: string, @Param('publicId') publicId: string) {
    try {
      await this.walletsDomainService.syncWalletWithPublicIdIncrementally(organizationId, publicId)
      return true
    } catch (e) {
      this.logger.error(`Error syncing wallet ${publicId} for organization ${organizationId}`, e)
      throw new InternalServerErrorException(`Error syncing wallet ${publicId} for organization ${organizationId}`)
    }
  }

  @Post('sync')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async syncAllWallets(@OrganizationId() organizationId: string) {
    try {
      await this.walletsDomainService.syncAll(organizationId, TaskSyncType.INCREMENTAL)
      return true
    } catch (e) {
      this.logger.error(`Error syncing all wallets for organization ${organizationId}`, e)
      throw new InternalServerErrorException(`Error syncing all wallets for organization ${organizationId}`)
    }
  }

  @Delete(':publicId')
  @RequirePermissionAction(Action.DELETE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  async delete(@Param('publicId') publicId: string, @OrganizationId() organizationId: string) {
    const result = await this.walletsDomainService.delete(publicId, organizationId)

    if (!result) {
      throw new NotFoundException()
    }
  }
}
