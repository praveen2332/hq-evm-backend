import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PostgresErrorCode } from '../common/constants'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { LoggerService } from '../common/logger/logger.service'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { OrganizationAddressesService } from '../common/services/general/organization-addresses.service'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { PaginationParams } from '../core/interfaces'
import dataSource from '../data-source'
import { Action, Resource } from '../permissions/interfaces'
import { SchedulesService } from '../schedules/schedules.service'
import {
  CreateSourceCdcDto,
  CreateSourceCoinbaseDto,
  CreateSourceEthDto,
  CreateSourceFtxDto,
  CreateSourceGnosisDto,
  IGnosisSource,
  SourceType,
  UpdateSourceDto,
  WithdrawFTXDto
} from './interfaces'
import { SourceCdc } from './source-cdc/source-cdc.entity'
import { SourceCdcService } from './source-cdc/source-cdc.service'
import { SourceCoinbase } from './source-coinbase/source-coinbase.entity'
import { SourceCoinbaseService } from './source-coinbase/source-coinbase.service'
import { SourceEth } from './source-eth-eoa/source-eth-eoa.entity'
import { SourceEthService } from './source-eth-eoa/source-eth-eoa.service'
import { SourceFtx } from './source-ftx/source-ftx.entity'
import { SourceFtxService } from './source-ftx/source-ftx.service'
import { SourceGnosis } from './source-gnosis/source-gnosis.entity'
import { SourceGnosisService } from './source-gnosis/source-gnosis.service'
import { SourceOfFund, SourceOfFundGnosis } from './source-of-fund.entity'
import { SourceOfFundsService } from './source-of-funds.service'

@ApiTags('sources')
@ApiBearerAuth()
@RequirePermissionResource(Resource.SOURCE_OF_FUNDS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class SourceOfFundsController {
  vaultUrl: string

  constructor(
    private sourceOfFundsService: SourceOfFundsService,
    private sourceFtxService: SourceFtxService,
    private sourceCoinbaseService: SourceCoinbaseService,
    private sourceCdcService: SourceCdcService,
    private sourceGnosisService: SourceGnosisService,
    private sourceEthService: SourceEthService,
    private organizationsService: OrganizationsService,
    private schedulesService: SchedulesService,
    private organizationAddressesService: OrganizationAddressesService,
    private configService: ConfigService,
    private logger: LoggerService
  ) {
    this.vaultUrl = this.configService.get('VAULT_URL')
  }

  async getDBInstance() {
    if (dataSource.isInitialized) {
      return dataSource
    }

    return dataSource.initialize()
  }

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getAll(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceOfFundsService.getAllPaging(
      query,
      ['name'],
      { organization: { id: organization.id } },
      ['organization']
    )

    for (const source of sources.items) {
      if (source.sourceType === SourceType.GNOSIS) {
        const gnosis = await this.sourceGnosisService.get(source.sourceId)
        const temp: SourceOfFundGnosis = source
        temp.address = gnosis ? gnosis.address : ''
        temp.blockchainId = gnosis ? gnosis.blockchainId : SupportedBlockchains.GOERLI
        temp.ownerAddresses = gnosis ? gnosis.ownerAddresses : []
        await this.schedulesService.getSafeGnosis(temp)
        this.sourceGnosisService.update({
          ...gnosis,
          threshold: temp.threshold || gnosis.threshold || 0,
          ownerAddresses: temp.ownerAddresses || []
        })
      }
      if (source.sourceType === SourceType.ETH) {
        const eth = await this.sourceEthService.get(source.sourceId)
        const temp: SourceOfFundGnosis = source
        temp.address = eth ? eth.address : ''
      }
    }

    return sources
  }

  @Get('available/:address')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async checkAvailableAddress(@Param('organizationId') organizationId: string, @Param('address') address: string) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceGnosisService.findOne({ where: { organizationId: organization.id, address } })

    return sources ? false : true
  }

  @Get('gnosis')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getGnosis(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceGnosisService.getAllPaging(query, [], { organizationId: organization.id })

    for (const item of sources.items as IGnosisSource[]) {
      const source = await this.sourceOfFundsService.findOne({
        where: { sourceId: item.id, sourceType: SourceType.GNOSIS }
      })
      item.name = source.name
    }

    return sources
  }

  @Get('cdc')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getCdc(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceCdcService.getAllPaging(query, [], { organizationId: organization.id })

    return sources
  }

  @Get('coinbase')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getCoinbase(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceCoinbaseService.getAllPaging(query, [], { organizationId: organization.id })

    return sources
  }

  @Get('ftx/:sourceId/balance')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getFtxBalance(@Param('organizationId') organizationId: string, @Param('sourceId') sourceId: string) {
    const sourceKey = await this.sourceOfFundsService.getSourceKey(sourceId)

    if (sourceKey && sourceKey.data)
      return this.sourceOfFundsService.getSourceFTXBalance(
        sourceKey.data.apiKey,
        sourceKey.data.secretKey,
        sourceKey.data.subAccountName
      )
    throw new BadRequestException('This source is invalid.')
  }

  // @Get('ftx/:sourceId/withdrawHistory')
  //
  // @ApiParam({ name: 'organizationId', type: 'string' })
  // async withdrawHistory(
  //   @Param('organizationId') organizationId: string,
  //   @Param('sourceId') sourceId: string,
  //   @Query() query: WithdrawHistoryParams
  // ) {
  //   try {
  //     const organization = await this.organizationsService.findByPublicId(organizationId)
  //     const source = await this.sourceFtxService.findOne({ where: { id: sourceId, organizationId: organization.id } })
  //     if (source) {
  //       const client = this.sourceOfFundsService.getSourceFTX(source.apiKey, source.secretKey, source.subAccountName)
  //       const res = await client.(dto)
  //       return res
  //     }
  //     throw new BadRequestException('This source is invalid.')
  //   } catch (error) {
  //     return error
  //   }
  // }

  @Post('ftx/:sourceId/withdraw')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async requestWithdraw(
    @Param('organizationId') organizationId: string,
    @Param('sourceId') sourceId: string,
    @Body(new ValidationPipe()) dto: WithdrawFTXDto
  ) {
    try {
      const organization = await this.organizationsService.findByPublicId(organizationId)
      const source = await this.sourceFtxService.findOne({ where: { id: sourceId, organizationId: organization.id } })
      if (source) {
        const client = this.sourceOfFundsService.getSourceFTX(source.apiKey, source.secretKey, source.subAccountName)
        const res = await client.requestWithdrawal(dto)
        return res
      }
      throw new BadRequestException('This source is invalid.')
    } catch (error) {
      return error
    }
  }

  // @Get('ftx/:sourceId')
  //
  // @ApiParam({ name: 'organizationId', type: 'string' })
  // async getFtxClient(@Param('organizationId') organizationId: string, @Param('sourceId') sourceId: string) {
  //   const organization = await this.organizationsService.findByPublicId(organizationId)
  //   const source = await this.sourceFtxService.findOne({ where: { id: sourceId, organizationId: organization.id } })
  //   if (source) return this.sourceOfFundsService.getSourceFTX(source.apiKey, source.secretKey, source.subAccountName)
  //   throw new BadRequestException('This source is invalid.')
  // }

  @Get('ftx')
  @RequirePermissionAction(Action.READ)
  // @CheckPolicies((ability: AppAbility) => ability.can(Action.READ, SourceOfFund))
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getFtx(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceFtxService.getAllPaging(query, [], { organizationId: organization.id })

    return sources
  }

  @Get('eth')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getEth(@Param('organizationId') organizationId: string, @Query() query: PaginationParams) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    const sources = await this.sourceEthService.getAllPaging(query, [], { organizationId: organization.id })

    return sources
  }

  @Get(':id')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async get(@Param('id') id: string) {
    const source = await this.sourceOfFundsService.get(id)
    switch (source.sourceType) {
      case SourceType.CDC:
        return this.sourceCdcService.get(source.sourceId)
      case SourceType.COINBASE:
        return this.sourceCoinbaseService.get(source.sourceId)
      case SourceType.FTX:
        return this.sourceFtxService.get(source.sourceId)
      case SourceType.GNOSIS:
        return this.sourceGnosisService.get(source.sourceId)
      case SourceType.ETH:
        return this.sourceEthService.get(source.sourceId)
    }
  }

  @Put(':id')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async updateSource(@Param('id') id: string, @Body(new ValidationPipe()) dto: UpdateSourceDto) {
    const source = await this.sourceOfFundsService.get(id)
    source.name = dto.name || source.name
    source.disabled = typeof dto.disabled === 'undefined' ? false : dto.disabled
    await this.sourceOfFundsService.update(source)

    return source
  }

  @Post('gnosis')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createSourceGnosis(
    @Body(new ValidationPipe()) dto: CreateSourceGnosisDto,
    @Param('organizationId') organizationId: string
  ) {
    const organization = await this.organizationsService.findByPublicId(organizationId)
    if (dto.name && dto.name !== '') {
      const existSafe = await this.sourceOfFundsService.findOne({
        where: [{ organization: { id: organization.id }, name: dto.name }],
        relations: ['organization']
      })

      if (existSafe) {
        throw new BadRequestException('This source already exists.')
      }
    }

    const addressLocation = await this.organizationAddressesService.getAddressLocation(
      dto.address,
      dto.blockchainId,
      organization.id
    )

    if (!!addressLocation) {
      throw new BadRequestException(`This address exists in '${addressLocation.message}'.`)
    }

    try {
      const result = await this.sourceGnosisService.restore({ organizationId: organization.id, address: dto.address })

      if (result.affected) {
        const source = await this.sourceGnosisService.findOne({
          where: { organizationId: organization.id, address: dto.address }
        })
        await this.sourceOfFundsService.restore({
          sourceId: source.id,
          sourceType: SourceType.GNOSIS
        })
        const sourceOfFund = await this.sourceOfFundsService.findOne({
          where: {
            sourceId: source.id,
            sourceType: SourceType.GNOSIS
          },
          relations: ['organization']
        })

        sourceOfFund.name = dto.name
        await this.sourceOfFundsService.update(sourceOfFund)

        return sourceOfFund
      }

      const sourceOfFund = new SourceOfFundGnosis()
      const app = await this.getDBInstance()
      await app.transaction(async (entityManager) => {
        const source = new SourceGnosis()
        source.address = dto.address
        source.blockchainId = dto.blockchainId
        source.ownerAddresses = dto.ownerAddresses
        source.organizationId = organization.id
        source.threshold = dto.threshold
        await entityManager.save(SourceGnosis, source)

        sourceOfFund.name = dto.name
        sourceOfFund.organization = organization
        sourceOfFund.sourceId = source.id
        sourceOfFund.sourceType = SourceType.GNOSIS
        sourceOfFund.address = dto.address
        sourceOfFund.blockchainId = dto.blockchainId
        await entityManager.save(SourceOfFund, sourceOfFund)
      })

      return sourceOfFund
    } catch (error) {
      if (
        error?.status === HttpStatus.BAD_REQUEST ||
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('This source already exists.')
      }

      throw new InternalServerErrorException()
    }
  }

  @Post('ftx')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createSourceFtx(
    @Body(new ValidationPipe()) dto: CreateSourceFtxDto,
    @Param('organizationId') organizationId: string
  ) {
    try {
      const organization = await this.organizationsService.findByPublicId(organizationId)

      const source = new SourceFtx()
      source.apiKey = dto.apiKey
      source.secretKey = dto.secretKey
      source.subAccountName = dto.subAccountName
      source.organizationId = organization.id

      const sourceCreated = await this.sourceFtxService.create(source)

      this.sourceOfFundsService.saveVaultData(sourceCreated.id, {
        apiKey: dto.apiKey,
        secretKey: dto.secretKey,
        subAccountName: dto.subAccountName
      })

      const sourceOfFund = new SourceOfFund()
      sourceOfFund.name = dto.name
      sourceOfFund.organization = organization
      sourceOfFund.sourceId = source.id
      sourceOfFund.sourceType = SourceType.FTX

      await this.sourceOfFundsService.create(sourceOfFund)

      return sourceOfFund
    } catch (error) {
      console.log(error)
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('This source already exists.')
      }

      throw new InternalServerErrorException()
    }
  }

  @Post('cdc')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createSourceCoinbase(
    @Body(new ValidationPipe()) dto: CreateSourceCdcDto,
    @Param('organizationId') organizationId: string
  ) {
    try {
      const organization = await this.organizationsService.findByPublicId(organizationId)

      const source = new SourceCdc()
      source.apiKey = dto.apiKey
      source.secretKey = dto.secretKey
      source.organizationId = organization.id

      await this.sourceCdcService.create(source)

      const sourceOfFund = new SourceOfFund()
      sourceOfFund.name = dto.name
      sourceOfFund.organization = organization
      sourceOfFund.sourceId = source.id
      sourceOfFund.sourceType = SourceType.CDC

      await this.sourceOfFundsService.create(sourceOfFund)

      return sourceOfFund
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('This source already exists.')
      }

      throw new InternalServerErrorException()
    }
  }

  @Post('coinbase')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createSourceCdc(
    @Body(new ValidationPipe()) dto: CreateSourceCoinbaseDto,
    @Param('organizationId') organizationId: string
  ) {
    try {
      const organization = await this.organizationsService.findByPublicId(organizationId)

      const source = new SourceCoinbase()
      source.accessToken = dto.accessToken
      source.refreshToken = dto.refreshToken
      source.expiryDate = dto.expiryDate
      source.organizationId = organization.id

      await this.sourceCoinbaseService.create(source)

      const sourceOfFund = new SourceOfFund()
      sourceOfFund.name = dto.name
      sourceOfFund.organization = organization
      sourceOfFund.sourceId = source.id
      sourceOfFund.sourceType = SourceType.COINBASE

      await this.sourceOfFundsService.create(sourceOfFund)

      return sourceOfFund
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('This source already exists.')
      }

      throw new InternalServerErrorException()
    }
  }

  @Post('eth')
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createSourceEth(
    @Body(new ValidationPipe()) dto: CreateSourceEthDto,
    @Param('organizationId') organizationId: string
  ) {
    const organization = await this.organizationsService.findByPublicId(organizationId)

    const addressLocation = await this.organizationAddressesService.getAddressLocation(
      dto.address,
      dto.blockchainId,
      organization.id
    )

    if (!!addressLocation) {
      throw new BadRequestException(`This address exists in ${addressLocation.message}'.`)
    }

    try {
      const result = await this.sourceEthService.restore({ organizationId: organization.id, address: dto.address })

      if (result.affected) {
        const source = await this.sourceEthService.findOne({
          where: { organizationId: organization.id, address: dto.address }
        })
        await this.sourceOfFundsService.restore({
          sourceId: source.id,
          sourceType: SourceType.ETH
        })
        const sourceOfFund = await this.sourceOfFundsService.findOne({
          where: {
            sourceId: source.id,
            sourceType: SourceType.ETH
          },
          relations: ['organization']
        })

        sourceOfFund.name = dto.name
        await this.sourceOfFundsService.update(sourceOfFund)
        return sourceOfFund
      }

      const sourceOfFund = new SourceOfFundGnosis()
      const app = await this.getDBInstance()
      await app.transaction(async (entityManager) => {
        const source = new SourceEth()
        source.address = dto.address
        source.organizationId = organization.id
        source.blockchainId = dto.blockchainId
        await entityManager.save(SourceEth, source)

        sourceOfFund.name = dto.name
        sourceOfFund.organization = organization
        sourceOfFund.sourceId = source.id
        sourceOfFund.sourceType = SourceType.ETH
        sourceOfFund.address = dto.address
        sourceOfFund.blockchainId = dto.blockchainId
        await entityManager.save(SourceOfFund, sourceOfFund)
      })

      return sourceOfFund
    } catch (error) {
      console.log(error)
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('This source already exists.')
      }

      throw new InternalServerErrorException()
    }
  }

  @Post('sync-balance')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async syncBalance(@Param('organizationId') organizationId: string) {
    const sources = await this.sourceOfFundsService.find({ where: { organization: { publicId: organizationId } } })
    for (const source of sources) {
      if (source.sourceType === SourceType.GNOSIS) {
        const gnosis = await this.sourceGnosisService.get(source.sourceId)
        if (gnosis) {
          source.balance = await this.sourceOfFundsService.getSourceGnosisBalance(gnosis.blockchainId, gnosis.address)
        }
      }
      if (source.sourceType === SourceType.ETH) {
        const eth = await this.sourceEthService.get(source.sourceId)
        if (eth) {
          source.balance = await this.sourceOfFundsService.getSourceETHBalance(eth.address)
        }
      }
      const deletedSource = this.sourceOfFundsService.get(source.id)
      if (deletedSource) {
        source.updatedAt = new Date()
        await this.sourceOfFundsService.create(source)
      }
    }

    return sources
  }

  @Post('sync-source-balance/:id')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async syncSourceBalance(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    const source = await this.sourceOfFundsService.findOne({
      where: { id, organization: { publicId: organizationId } }
    })
    if (source.sourceType === SourceType.GNOSIS) {
      const gnosis = await this.sourceGnosisService.get(source.sourceId)
      if (gnosis) {
        source.balance = await this.sourceOfFundsService.getSourceGnosisBalance(gnosis.blockchainId, gnosis.address)
      }
    }
    if (source.sourceType === SourceType.ETH) {
      const eth = await this.sourceEthService.get(source.sourceId)
      if (eth) {
        source.balance = await this.sourceOfFundsService.getSourceETHBalance(eth.address)
      }
    }
    const deletedSource = this.sourceOfFundsService.get(source.id)
    if (deletedSource) {
      source.updatedAt = new Date()
      await this.sourceOfFundsService.create(source)
    }

    return source
  }

  @Post('sync-transactions')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async syncTransactions(@Param('organizationId') organizationId: string) {
    const sources = await this.sourceOfFundsService.find({ where: { organization: { publicId: organizationId } } })
    for (const source of sources) {
      if (source.sourceType === SourceType.GNOSIS) {
        const gnosis = await this.sourceGnosisService.get(source.sourceId)
        if (gnosis) {
          await this.schedulesService.syncGnosisTransactionsWrapper(source, gnosis)
        }
      }
      if (source.sourceType === SourceType.ETH) {
        const eth = await this.sourceEthService.get(source.sourceId)
        if (eth) {
          await this.schedulesService.syncMetamaskTransactionWrapper(source, eth)
        }
      }

      if (source.sourceType === SourceType.FTX) {
        const ftx = await this.sourceFtxService.get(source.sourceId)
        if (ftx) {
          await this.schedulesService.syncFTXTransaction(source, ftx)
        }
      }
    }

    return true
  }

  @Post('sync-source-transactions/:id')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async syncSourceTransactions(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    const source = await this.sourceOfFundsService.findOne({
      where: { id, organization: { publicId: organizationId } }
    })
    if (source && source.sourceType === SourceType.GNOSIS) {
      const gnosis = await this.sourceGnosisService.get(source.sourceId)
      if (gnosis) {
        await this.schedulesService.syncGnosisTransactionsWrapper(source, gnosis)
      }
    }
    if (source && source.sourceType === SourceType.ETH) {
      const eth = await this.sourceEthService.get(source.sourceId)
      if (eth) {
        await this.schedulesService.syncMetamaskTransactionWrapper(source, eth)
      }
    }
    if (source && source.sourceType === SourceType.FTX) {
      const ftx = await this.sourceFtxService.get(source.sourceId)
      if (ftx) {
        await this.schedulesService.syncFTXTransaction(source, ftx)
      }
    }

    return true
  }

  @Delete(':id')
  @RequirePermissionAction(Action.DELETE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async delete(@Param('id') id: string, @Param('organizationId') organizationId: string) {
    const source = await this.sourceOfFundsService.findOne({
      where: { id, organization: { publicId: organizationId } },
      relations: ['organization']
    })
    if (!source) {
      throw new NotFoundException()
    }

    const { sourceType } = source

    try {
      const app = await this.getDBInstance()
      await app.transaction(async (entityManager) => {
        switch (sourceType) {
          case SourceType.CDC:
            await entityManager.softDelete(SourceCdc, source.sourceId)
            break
          case SourceType.COINBASE:
            await entityManager.softDelete(SourceCoinbase, source.sourceId)
            break
          case SourceType.FTX:
            await entityManager.softDelete(SourceFtx, source.sourceId)
            break
          case SourceType.GNOSIS:
            await entityManager.softDelete(SourceGnosis, source.sourceId)
            break
          case SourceType.ETH:
            await entityManager.softDelete(SourceEth, source.sourceId)
            break
        }

        await entityManager.softDelete(SourceOfFund, source.id)
      })

      return true
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException()
    }
  }
}
