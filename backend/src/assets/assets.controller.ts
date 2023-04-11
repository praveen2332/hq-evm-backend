import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PaginationResponse } from '../core/interfaces'
import { Action, Resource } from '../permissions/interfaces'
import { AssetsDomainService } from './assets.domain.service'
import { AssetQueryParams, AssetResponseDto, TaxLotQueryParams, TaxLotResponseDto } from './interfaces'

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@RequirePermissionResource(Resource.ASSETS)
@Controller()
export class AssetsController {
  constructor(private assetsDomainService: AssetsDomainService) {}

  @Get()
  @ApiResponse({ status: 200, type: AssetResponseDto, isArray: true })
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getAll(
    @OrganizationId() organizationId: string,
    @Query() query: AssetQueryParams
  ): Promise<AssetResponseDto[]> {
    const assetResponseDtos: AssetResponseDto[] = await this.assetsDomainService.getAssetsForOrganization(
      organizationId,
      query.blockchainIds,
      query.nameOrSymbol
    )

    return assetResponseDtos
  }

  @Get(':publicId/tax-lots')
  @ApiResponse({ status: 200, type: TaxLotResponseDto, isArray: true })
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'publicId', type: 'string' })
  async getTaxLotsForAsset(
    @OrganizationId() organizationId: string,
    @Param('publicId', new ParseUUIDPipe()) publicId: string,
    @Query() query: TaxLotQueryParams
  ): Promise<PaginationResponse<TaxLotResponseDto>> {
    const { paginatedTaxLots, wallets } = await this.assetsDomainService.getPaginatedTaxLotsForAsset(
      organizationId,
      publicId,
      query
    )

    return {
      ...paginatedTaxLots,
      items: paginatedTaxLots.items?.map((source) => TaxLotResponseDto.map(source, wallets))
    }
  }

  // TODO: Descoped until end of April 2023
  // @Post(':publicId/revalue/mock')
  // @ApiResponse({ status: 200, type: RevalueResponseDto, isArray: true })
  // @RequirePermissionAction(Action.CREATE)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // @ApiParam({ name: 'organizationId', type: 'string' })
  // @ApiParam({ name: 'publicId', type: 'string' })
  // async mockRevalue(
  //   @OrganizationId() organizationId: string,
  //   @Param('publicId', new ParseUUIDPipe()) publicId: string,
  //   @Body() body: RevalueBodyParams
  // ): Promise<RevalueResponseDto> {
  //   const revalueResponseDto = await this.assetsDomainService.getRevalueResponseDto(
  //     publicId,
  //     organizationId,
  //     body.revalueAt,
  //     body.newPricePerUnit,
  //   )

  //   return revalueResponseDto
  // }

  // @Post(':publicId/revalue/execute')
  // @ApiResponse({ status: 200, type: RevalueResponseDto, isArray: true })
  // // @RequirePermissionAction(Action.READ)
  // @UsePipes(new ValidationPipe({ transform: true }))
  // @ApiParam({ name: 'organizationId', type: 'string' })
  // @ApiParam({ name: 'publicId', type: 'string' })
  // async executeRevalue(
  //   @OrganizationId() organizationId: string,
  //   @Param('publicId', new ParseUUIDPipe()) publicId: string,
  //   @Body() body: RevalueBodyParams,
  //   @Req() req
  // ) {
  //   const { accountId } = req.user

  //   const revalueResponseDto = await this.assetsDomainService.executeRevalue(
  //     publicId,
  //     organizationId,
  //     body.revalueAt,
  //     body.newPricePerUnit,
  //     accountId
  //   )

  //   // return revalueResponseDto
  // }
}
