import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { Action, Resource } from '../permissions/interfaces'
import { CryptocurrenciesDomainService } from './cryptocurrencies.domain.service'
import { CryptocurrenciesByWalletIdsQueryParams, CryptocurrencyResponseDto } from './interfaces'

@ApiTags('cryptocurrencies')
@ApiBearerAuth()
@RequirePermissionResource(Resource.CRYPTOCURRENCIES)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class CryptocurrenciesController {
  constructor(private cryptocurrenciesDomainService: CryptocurrenciesDomainService) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: CryptocurrencyResponseDto, isArray: true })
  async getByWalletIds(
    @OrganizationId() organizationId: string,
    @Query() query: CryptocurrenciesByWalletIdsQueryParams
  ) {
    return await this.cryptocurrenciesDomainService.getByOrganizationAndWalletPublicIds(
      organizationId,
      query.walletIds,
      query.blockchainIds
    )
  }
}
