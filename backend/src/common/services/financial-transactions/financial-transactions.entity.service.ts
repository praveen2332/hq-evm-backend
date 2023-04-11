import { BadRequestException, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { String } from 'aws-sdk/clients/acm'
import Decimal from 'decimal.js'
import {
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  MoreThan,
  Repository,
  SelectQueryBuilder
} from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Direction, PaginationResponse } from '../../../core/interfaces'
import { FinancialTransactionQueryParams } from '../../../financial-transactions/interfaces'
import { dateHelper } from '../../helpers/date.helper'
import { LoggerService } from '../../logger/logger.service'
import { BlockchainsService } from '../blockchains/blockchains.service'
import { TaxLotSale } from '../gains-losses/tax-lot-sale.entity'
import { Wallet } from '../wallets/wallet.entity'
import { WalletsService } from '../wallets/wallets.service'
import {
  FinancialTransactionChildGnosisMetadata,
  FinancialTransactionChildMetadata
} from './financial-transaction-child-metadata.entity'
import { FinancialTransactionChild } from './financial-transaction-child.entity'
import { FinancialTransactionFile } from './financial-transaction-files.entity'
import { FinancialTransactionParent } from './financial-transaction-parent.entity'
import { FinancialTransactionPreprocess } from './financial-transaction-preprocess.entity'
import {
  CreateFinancialTransactionChildDto,
  CreateFinancialTransactionParentDto,
  CreateFinancialTransactionPreprocessDto,
  FinancialTransactionChildMetadataDirection,
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataSubstatus,
  FinancialTransactionChildMetadataType,
  FinancialTransactionParentActivity,
  FinancialTransactionPreprocessStatus,
  UNCATEGORIZED
} from './interfaces'

@Injectable()
export class FinancialTransactionsEntityService extends BaseService<FinancialTransactionParent> {
  constructor(
    @InjectRepository(FinancialTransactionParent)
    private financialTransactionParentRepository: Repository<FinancialTransactionParent>,
    @InjectRepository(FinancialTransactionChild)
    private financialTransactionChildRepository: Repository<FinancialTransactionChild>,
    @InjectRepository(FinancialTransactionChildMetadata)
    private financialTransactionChildMetadataRepository: Repository<FinancialTransactionChildMetadata>,
    @InjectRepository(FinancialTransactionPreprocess)
    private financialTransactionPreprocessRepository: Repository<FinancialTransactionPreprocess>,
    @InjectRepository(FinancialTransactionFile)
    private financialTransactionFileRepository: Repository<FinancialTransactionFile>,
    private walletsService: WalletsService,
    private blockchainsService: BlockchainsService,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService
  ) {
    super(financialTransactionParentRepository)
  }

  async getAllChildPaging(
    options: FinancialTransactionQueryParams,
    organizationId: string
  ): Promise<PaginationResponse<FinancialTransactionChild>> {
    const size = options.size || 10
    const page = options.page || 0
    const [items, totalItems] = await this.getAllTxQuery(options, organizationId, false)
      .take(size)
      .skip(page * size)
      .getManyAndCount()

    return PaginationResponse.from({
      totalItems,
      currentPage: page,
      items,
      limit: size
    })
  }

  async getAllChildren(
    options: FinancialTransactionQueryParams,
    organizationId: string
  ): Promise<FinancialTransactionChild[]> {
    const query = this.getAllTxQuery(options, organizationId, true)
    return await query.getMany()
  }

  getAllChildrenByAddressesAndBlockchainIdAndCryptocurrencyId(params: {
    addresses: string[]
    blockchainId: string
    organizationId: string
    cryptocurrencyId: string
    lastCompletedFinancialTransactionChildId?: string | null
  }) {
    // TODO: Need deeper thinking how to handle when transaction is still syncing status
    const individualWhereConditions: FindOptionsWhere<FinancialTransactionChild> = {
      financialTransactionChildMetadata: {
        status: In([FinancialTransactionChildMetadataStatus.SYNCED, FinancialTransactionChildMetadataStatus.SYNCING])
      },
      organizationId: params.organizationId,
      blockchainId: params.blockchainId,
      cryptocurrency: { id: params.cryptocurrencyId }
    }

    if (params.lastCompletedFinancialTransactionChildId) {
      individualWhereConditions.id = MoreThan(params.lastCompletedFinancialTransactionChildId)
    }

    let whereConditions: FindOptionsWhere<FinancialTransactionChild>[] = [
      {
        ...individualWhereConditions,
        fromAddress: In(params.addresses),
        financialTransactionChildMetadata: { direction: FinancialTransactionChildMetadataDirection.OUTGOING }
      },
      {
        ...individualWhereConditions,
        toAddress: In(params.addresses),
        financialTransactionChildMetadata: { direction: FinancialTransactionChildMetadataDirection.INCOMING }
      }
    ]

    return this.financialTransactionChildRepository.find({
      where: whereConditions,
      relations: { financialTransactionChildMetadata: true, cryptocurrency: true },
      order: { valueTimestamp: Direction.ASC, id: Direction.ASC }
    })
  }

  private getAllTxQuery(
    options: FinancialTransactionQueryParams,
    organizationId: string,
    isForExport
  ): SelectQueryBuilder<FinancialTransactionChild> {
    const order = options.order || 'fn_tx_child.valueTimestamp'
    const direction = options.direction || Direction.DESC

    const orderBy = { [order]: direction }

    let whereQuery = 'fn_tx_child.organization_id = :organizationId'

    if (options.blockchainIds?.length) {
      whereQuery += ' AND fn_tx_child.blockchain_id IN (:...blockchainIds)'
    }
    if (options.startTime) {
      whereQuery += ' AND fn_tx_child.value_timestamp >= :startTime'
    }
    if (options.endTime) {
      whereQuery += ' AND fn_tx_child.value_timestamp <= :endTime'
    }
    if (options.walletAddresses?.length) {
      whereQuery +=
        ' AND (fn_tx_child.from_address IN (:...walletAddresses) OR fn_tx_child.to_address IN (:...walletAddresses))'
    }
    if (options.fromAddresses?.length) {
      whereQuery += ' AND fn_tx_child.from_address IN (:...fromAddresses)'
    }
    if (options.toAddresses?.length) {
      whereQuery += ' AND fn_tx_child.to_address IN (:...toAddresses)'
    }
    if (options.childTypes?.length) {
      whereQuery += ' AND fn_tx_child_metadata.type = ANY(:types)'
    }
    if (options.activities?.length) {
      whereQuery += ' AND fn_tx_parent.activity = ANY(:activities)'
    }
    if (options.assetIds?.length) {
      whereQuery += ' AND crypto.public_id IN (:...assetIds)'
    }
    if (options.search) {
      whereQuery += ' AND fn_tx_child.hash ilike :search'
    }

    const isUncategorized = options.categories?.includes(UNCATEGORIZED)
    const categoryPublicIds = options.categories?.filter((category) => category !== UNCATEGORIZED)
    if (categoryPublicIds?.length) {
      if (isUncategorized) {
        whereQuery += ' AND (category.public_id IN (:...categories) OR fn_tx_child_metadata.category_id IS NULL)'
      } else {
        whereQuery += ' AND category.public_id IN (:...categories)'
      }
    } else if (isUncategorized) {
      whereQuery += ' AND fn_tx_child_metadata.category_id IS NULL'
    }

    if (options.substatuses?.length) {
      whereQuery += ' AND fn_tx_child_metadata.substatuses && (:substatuses)'
    }

    if (options.childStatuses?.length) {
      whereQuery += ' AND fn_tx_child_metadata.status = ANY(:childStatuses)'
    }

    if (options.fromFiatAmount) {
      whereQuery += ' AND fn_tx_child_metadata.fiat_amount::DECIMAL >= :fromFiatAmount'
    }

    if (options.toFiatAmount) {
      whereQuery += ' AND fn_tx_child_metadata.fiat_amount::DECIMAL <= :toFiatAmount'
    }

    const params = {
      organizationId: organizationId,
      blockchainIds: options.blockchainIds,
      startTime: options.startTime,
      endTime: options.endTime,
      walletAddresses: options.walletAddresses,
      fromAddresses: options.fromAddresses,
      toAddresses: options.toAddresses,
      types: options.childTypes,
      activities: options.activities,
      substatuses: options.substatuses,
      childStatuses: options.childStatuses,
      assetIds: options.assetIds,
      search: `%${options.search ?? ''}%`,
      categories: categoryPublicIds,
      fromFiatAmount: options.fromFiatAmount?.toNumber(),
      toFiatAmount: options.toFiatAmount?.toNumber()
    }

    const queryBuilder = this.financialTransactionChildRepository
      .createQueryBuilder('fn_tx_child')
      .leftJoinAndSelect('fn_tx_child.financialTransactionChildMetadata', 'fn_tx_child_metadata')
      .leftJoinAndSelect('fn_tx_child_metadata.category', 'category')
      .innerJoinAndSelect('fn_tx_child.financialTransactionParent', 'fn_tx_parent')
      .innerJoinAndSelect('fn_tx_child.cryptocurrency', 'crypto')
      .innerJoinAndSelect('crypto.addresses', 'crypto_addresses')
      .addSelect(
        `(CASE WHEN fn_tx_child_metadata.type = '${FinancialTransactionChildMetadataType.FEE}' THEN 1 ELSE 0 END)`,
        'is_fee'
      )
      .where(whereQuery, params)
      .orderBy(orderBy)
      .addOrderBy('is_fee')
      .addOrderBy('fn_tx_child.id', Direction.ASC)

    if (isForExport) {
      return queryBuilder
    } else {
      //we need that for calculating totalItems for pagination purposes
      return queryBuilder.innerJoinAndSelect('fn_tx_parent.financialTransactionChild', 'fn_tx_parent_children')
    }
  }

  getAllChildrenFromAddressWithMissingPrice(params: {
    address: string
    blockchainId: string
    organizationId: string
  }): Promise<FinancialTransactionChild[]> {
    const individualWhereConditions: FindOptionsWhere<FinancialTransactionChild> = {
      financialTransactionChildMetadata: {
        fiatAmountPerUnit: IsNull()
      },
      organizationId: params.organizationId,
      blockchainId: params.blockchainId
    }

    let whereConditions: FindOptionsWhere<FinancialTransactionChild>[] = [
      { ...individualWhereConditions, fromAddress: params.address },
      { ...individualWhereConditions, toAddress: params.address }
    ]

    return this.financialTransactionChildRepository.find({
      where: whereConditions,
      relations: { financialTransactionChildMetadata: true, cryptocurrency: true },
      order: {
        valueTimestamp: 'DESC'
      }
    })
  }

  getAllChildrenFromOrganization(
    organizationId: string,
    relations: FindOptionsRelations<FinancialTransactionChild> = {}
  ): Promise<FinancialTransactionChild[]> {
    return this.financialTransactionChildRepository.find({
      where: { organizationId },
      relations: relations,
      order: {
        valueTimestamp: 'DESC'
      }
    })
  }

  getAllChildrenFromAddress(params: {
    address: string
    organizationId: string
    relations: FindOptionsRelations<FinancialTransactionChild>
  }): Promise<FinancialTransactionChild[]> {
    const individualWhereConditions: FindOptionsWhere<FinancialTransactionChild> = {
      organizationId: params.organizationId
    }

    let whereConditions: FindOptionsWhere<FinancialTransactionChild>[] = [
      { ...individualWhereConditions, fromAddress: params.address },
      { ...individualWhereConditions, toAddress: params.address }
    ]

    return this.financialTransactionChildRepository.find({
      where: whereConditions,
      relations: params.relations,
      order: {
        valueTimestamp: 'DESC'
      }
    })
  }

  getAllChildrenFromOrganizationWithToAddressAndBlockchainId(params: {
    organizationId: string
    toAddress: string
    blockchainId: String
    relations?: FindOptionsRelations<FinancialTransactionChild>
  }): Promise<FinancialTransactionChild[]> {
    const whereConditions: FindOptionsWhere<FinancialTransactionChild> = {
      organizationId: params.organizationId,
      toAddress: params.toAddress,
      blockchainId: params.blockchainId
    }

    return this.financialTransactionChildRepository.find({
      where: whereConditions,
      relations: params.relations,
      order: {
        valueTimestamp: 'DESC'
      }
    })
  }

  async createOrUpdateChild(dto: CreateFinancialTransactionChildDto) {
    const financialTransactionChild = await FinancialTransactionChild.createFromDto(dto)

    try {
      const exist = await this.financialTransactionChildRepository.findOne({
        where: { publicId: financialTransactionChild.publicId, organizationId: dto.organizationId },
        relations: { financialTransactionChildMetadata: true }
      })

      if (!exist) {
        const child = await this.financialTransactionChildRepository.save(financialTransactionChild)
        const metadata = FinancialTransactionChildMetadata.createFromDtoAndChild(dto, child)
        await this.financialTransactionChildMetadataRepository.save(metadata)

        child.financialTransactionChildMetadata = metadata
        return child
      } else {
        const metadata = exist.financialTransactionChildMetadata
        const partialMetadata: Partial<FinancialTransactionChildMetadata> = {}
        if (metadata.type !== dto.type) {
          partialMetadata.type = dto.type
        }

        if (metadata.gainLossInclusionStatus !== dto.gainLossInclusionStatus) {
          partialMetadata.gainLossInclusionStatus = dto.gainLossInclusionStatus
        }

        if (Object.keys(partialMetadata).length) {
          await this.financialTransactionChildMetadataRepository.update(metadata.id, partialMetadata)
        }
      }

      return exist
    } catch (e) {
      this.logger.error('financialTransactionChild save error:', financialTransactionChild, e)
      throw e
    }
  }

  async getChildWithMetadataById(id: string) {
    return this.financialTransactionChildRepository.findOne({
      where: { id: id },
      relations: { cryptocurrency: true, financialTransactionChildMetadata: true }
    })
  }

  async getChildWithAllRelationsById(id: string) {
    return this.financialTransactionChildRepository.findOne({
      where: { id: id },
      relations: {
        financialTransactionChildMetadata: true,
        financialTransactionParent: {
          financialTransactionChild: true
        },
        cryptocurrency: {
          addresses: true
        }
      }
    })
  }

  updateChildMetadata(id: string, metadata: Partial<FinancialTransactionChildMetadata>) {
    return this.financialTransactionChildMetadataRepository.update(id, metadata)
  }

  updateChildMetadataByChildId(childId: string, metadata: Partial<FinancialTransactionChildMetadata>) {
    return this.financialTransactionChildMetadataRepository.update(
      { financialTransactionChild: { id: childId } },
      metadata
    )
  }

  async updateChildIdWithStatus(id: string, status: FinancialTransactionChildMetadataStatus) {
    return this.financialTransactionChildMetadataRepository.update(
      { financialTransactionChild: { id: id } },
      { status: status }
    )
  }

  async updateChildWithParentAndStatus(child: FinancialTransactionChild, parent: FinancialTransactionParent) {
    //TODO: Properly throw and handle below errors
    if (child.hash !== parent.hash) {
      this.logger.log('Hash error here')
      return
    }

    if (child.organizationId !== parent.organizationId) {
      this.logger.log('Org id mismatch here')
      return
    }

    const updateData: Partial<FinancialTransactionChild> = {
      financialTransactionParent: parent
    }

    return this.financialTransactionChildRepository.update(child.id, updateData)
  }

  async createOrUpdateParent(dto: CreateFinancialTransactionParentDto) {
    const financialTransactionParent = FinancialTransactionParent.createFromDto(dto)

    try {
      const exist = await this.financialTransactionParentRepository.findOne({
        where: {
          publicId: financialTransactionParent.publicId,
          organizationId: dto.organizationId
        }
      })
      if (!exist) {
        return this.financialTransactionParentRepository.save(financialTransactionParent)
      } else {
        if (exist.activity !== dto.activity) {
          await this.financialTransactionParentRepository.update(exist.id, { activity: dto.activity })
          exist.activity = dto.activity
        }
      }
      return exist
    } catch (e) {
      this.logger.error('financialTransactionParent create error: ', financialTransactionParent, e)
      throw e
    }
  }

  async createPreprocess(dto: CreateFinancialTransactionPreprocessDto) {
    const financialTransactionPreprocess = FinancialTransactionPreprocess.createFromDto(dto)

    try {
      const exist = await this.financialTransactionPreprocessRepository.findOne({
        where: { uniqueId: financialTransactionPreprocess.uniqueId }
      })
      return exist ? exist : this.financialTransactionPreprocessRepository.save(financialTransactionPreprocess)
    } catch (e) {
      this.logger.log('FinancialTransactionPreprocess create error XXXXXXXX', financialTransactionPreprocess, e)
      return
    }
  }

  getPreprocessHashesByAddressAndChainAndStatus(
    address: string,
    blockchainId: string,
    status: FinancialTransactionPreprocessStatus,
    lastCompletedFinancialTransactionPreprocessId: string
  ): Promise<FinancialTransactionPreprocess[]> {
    address = address.toLowerCase()

    const individualWhereConditions: FindOptionsWhere<FinancialTransactionPreprocess> = {
      status: status,
      blockchainId: blockchainId
    }

    if (lastCompletedFinancialTransactionPreprocessId) {
      individualWhereConditions.id = MoreThan(lastCompletedFinancialTransactionPreprocessId)
    }

    let whereConditions: FindOptionsWhere<FinancialTransactionPreprocess>[] = [
      { ...individualWhereConditions, fromAddress: address },
      { ...individualWhereConditions, toAddress: address }
    ]

    return this.financialTransactionPreprocessRepository.find({
      select: { id: true, hash: true },
      where: whereConditions,
      order: { valueTimestamp: Direction.ASC, id: Direction.ASC }
    })
  }

  async getPreprocessTransactionsByHash(
    hash: string,
    status: FinancialTransactionPreprocessStatus
  ): Promise<FinancialTransactionPreprocess[]> {
    return this.financialTransactionPreprocessRepository.find({
      where: { hash, status },
      relations: { cryptocurrency: true },
      order: { id: Direction.ASC }
    })
  }

  getParentByHashAndOrganization(hash: string, organizationId: string) {
    return this.financialTransactionParentRepository.findOne({
      where: { hash: hash, organizationId: organizationId },
      relations: {
        financialTransactionChild: {
          financialTransactionChildMetadata: {
            category: true
          },
          cryptocurrency: true
        }
      }
    })
  }

  getChildWithMetadataByOrganizationIdAndPublicId(params: { publicId: string; organizationId: string }) {
    return this.financialTransactionChildRepository.findOne({
      where: {
        publicId: params.publicId,
        organizationId: params.organizationId
      },
      relations: ['financialTransactionChildMetadata']
    })
  }

  getChildByOrganizationIdAndPublicId(params: { publicId: string; organizationId: string }) {
    return this.financialTransactionChildRepository.findOne({
      where: {
        publicId: params.publicId,
        organizationId: params.organizationId
      }
    })
  }

  getCryptocurrenciesByAddressesAndBlockchainAndOrganization(
    addresses: string[],
    blockchainId: string,
    organizationId: string,
    lastCompletedFinancialTransactionChildId: string | null
  ) {
    let whereQuery = 'child.organization_id = :organizationId AND child.blockchain_id = :blockchainId'

    if (lastCompletedFinancialTransactionChildId) {
      whereQuery += ' AND child.id > :lastCompletedFinancialTransactionChildId'
    }

    whereQuery += ' AND (child.from_address IN (:...addresses) OR child.to_address IN (:...addresses))'

    return this.financialTransactionChildRepository
      .createQueryBuilder('child')
      .select(['child.cryptocurrency_id'])
      .loadAllRelationIds({ relations: ['cryptocurrency'] })
      .where(whereQuery, {
        organizationId,
        blockchainId,
        addresses,
        lastCompletedFinancialTransactionChildId
      })
      .distinctOn(['child.cryptocurrency_id'])
      .getRawMany()
  }

  async saveFile(file: FinancialTransactionFile) {
    return this.financialTransactionFileRepository.save(file)
  }

  async getFileByOrganizationIdAndPublicId(param: { organizationId: string; childPublicId: string; publicId: string }) {
    const child = await this.getChildByOrganizationIdAndPublicId({
      organizationId: param.organizationId,
      publicId: param.childPublicId
    })

    return this.financialTransactionFileRepository.findOne({
      where: {
        publicId: param.publicId,
        organizationId: param.organizationId,
        financialTransactionChildId: child?.id ?? null
      }
    })
  }

  getParentActivity(params: { fromCount: number; toCount: number }): FinancialTransactionParentActivity {
    let activity = FinancialTransactionParentActivity.CONTRACT_INTERACTION
    if (params.fromCount > 0 && params.toCount > 0) {
      activity = FinancialTransactionParentActivity.SWAP
    } else if (params.fromCount > 0 || params.toCount > 0) {
      activity = FinancialTransactionParentActivity.TRANSFER
    }

    return activity
  }

  getChildWithDeleted(childId: string) {
    return this.financialTransactionChildRepository.findOne({ where: { id: childId }, withDeleted: true })
  }

  async generatePartialChildMetadataForGainLossUpdate(params: {
    childId: string
    taxLotSales: TaxLotSale[]
    updatedBy: string
  }) {
    const partialMetadata: Partial<FinancialTransactionChildMetadata> = {}
    const tempDate = dateHelper.getUTCTimestamp()

    const costBasis = params.taxLotSales.reduce(
      (sum, curr) => Decimal.add(sum, Decimal.mul(curr.costBasisPerUnit, curr.soldAmount)),
      new Decimal(0)
    )

    const child = await this.getChildWithMetadataById(params.childId)

    partialMetadata.costBasis = costBasis.toString()
    partialMetadata.costBasisUpdatedAt = tempDate
    partialMetadata.costBasisUpdatedBy = params.updatedBy
    // TODO:BUG: caught once that costBasis or fiatAmount was null
    partialMetadata.gainLoss = Decimal.sub(child.financialTransactionChildMetadata.fiatAmount, costBasis).toString()

    return partialMetadata
  }

  generatePartialChildMetadataForPriceUpdate(params: {
    cryptocurrencyAmount: string
    pricePerUnit?: Decimal
    totalPrice?: Decimal
    fiatCurrency: string
    updatedBy: string
  }) {
    if (!params.pricePerUnit && !params.totalPrice) {
      const errorMessage = 'Price update needs to have pricePerUnit or totalPrice'
      this.logger.error(errorMessage)
      throw new BadRequestException(errorMessage)
    }
    const partialMetadata: Partial<FinancialTransactionChildMetadata> = {}
    const tempDate = dateHelper.getUTCTimestamp()

    if (params.pricePerUnit) {
      partialMetadata.fiatAmountPerUnit = params.pricePerUnit.toString()
      partialMetadata.fiatAmount = Decimal.mul(
        partialMetadata.fiatAmountPerUnit,
        params.cryptocurrencyAmount
      ).toString()
    } else {
      partialMetadata.fiatAmountPerUnit = Decimal.div(params.totalPrice, params.cryptocurrencyAmount).toString()
      partialMetadata.fiatAmount = params.totalPrice.toString()
    }

    partialMetadata.fiatCurrency = params.fiatCurrency

    partialMetadata.fiatAmountUpdatedBy = params.updatedBy
    partialMetadata.fiatAmountUpdatedAt = tempDate
    partialMetadata.fiatAmountPerUnitUpdatedBy = params.updatedBy
    partialMetadata.fiatAmountPerUnitUpdatedAt = tempDate

    return partialMetadata
  }

  generatePartialChildMetadataForWipingCostBasis(updatedBy: string): Partial<FinancialTransactionChildMetadata> {
    const partialMetadata: Partial<FinancialTransactionChildMetadata> = {}
    partialMetadata.costBasis = null
    partialMetadata.costBasisUpdatedAt = dateHelper.getUTCTimestamp()
    partialMetadata.costBasisUpdatedBy = updatedBy
    partialMetadata.gainLoss = null
    return partialMetadata
  }

  addSubstatusToChildMetadata(
    substatus: FinancialTransactionChildMetadataSubstatus,
    metadata: Partial<FinancialTransactionChildMetadata>
  ) {
    if (!metadata.substatuses) {
      metadata.substatuses = []
    }
    if (!metadata.substatuses.includes(substatus)) {
      metadata.substatuses.push(substatus)
    }
  }

  removeSubstatusFromChildMetadata(
    substatus: FinancialTransactionChildMetadataSubstatus,
    metadata: Partial<FinancialTransactionChildMetadata>
  ) {
    if (metadata?.substatuses && metadata.substatuses.includes(substatus)) {
      metadata.substatuses.splice(metadata.substatuses.indexOf(substatus), 1)
    }
  }

  // async changeChildStatus(params: {
  //   organizationId: string
  //   childId: string
  //   childMetadataId: string
  //   status: FinancialTransactionChildMetadataStatus
  // }) {
  //   const child = await this.financialTransactionChildRepository.findOne({ where: { id: params.childId } })
  //   const metadata = await this.financialTransactionChildMetadataRepository.findOne({
  //     where: { id: params.childMetadataId }
  //   })

  //   let updateChildMetadata: Partial<FinancialTransactionChildMetadata> = {}
  //   let toRecalculateGainLoss = false

  //   if (params.status === FinancialTransactionChildMetadataStatus.IGNORED) {
  //     if (metadata.status !== FinancialTransactionChildMetadataStatus.SYNCED) {
  //       this.logger.log('Transaction is not in the right state to be ignored', metadata.status)
  //       throw new BadRequestException('Transaction is not in the right state to be ignored')
  //     }
  //     toRecalculateGainLoss = true

  //     updateChildMetadata = this.generatePartialChildMetadataForWipingCostBasis('service_gain_loss_workflow')

  //     updateChildMetadata.status = FinancialTransactionChildMetadataStatus.IGNORED
  //   } else if (params.status === FinancialTransactionChildMetadataStatus.SYNCED) {
  //     if (metadata.status !== FinancialTransactionChildMetadataStatus.IGNORED) {
  //       throw new BadRequestException('Cannot un-ignore a transaction that is not ignored')
  //     }

  //     updateChildMetadata = {
  //       status: FinancialTransactionChildMetadataStatus.SYNCED
  //     }
  //     toRecalculateGainLoss = true
  //   }

  //   await this.updateChildMetadata(metadata.id, updateChildMetadata)

  //   if (toRecalculateGainLoss) {
  //     const fromWallet = await this.walletsService.getByOrganizationIdAndAddress(
  //       params.organizationId,
  //       child.fromAddress,
  //       { walletGroup: true }
  //     )

  //     const toWallet = await this.walletsService.getByOrganizationIdAndAddress(params.organizationId, child.toAddress, {
  //       walletGroup: true
  //     })

  //     const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
  //     if (fromWallet?.walletGroup?.id) {
  //       for (const blockchainId of blockchainIds) {
  //         this.eventEmitter.emit(
  //           FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET_GROUP,
  //           ResyncGainLossForGroupEventParams.map({ walletGroupId: fromWallet.walletGroup.id, blockchainId })
  //         )
  //       }
  //     }

  //     if (toWallet?.walletGroup?.id && toWallet.walletGroup.id !== fromWallet?.walletGroup?.id) {
  //       for (const blockchainId of blockchainIds) {
  //         this.eventEmitter.emit(
  //           FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET_GROUP,
  //           ResyncGainLossForGroupEventParams.map({ walletGroupId: toWallet.walletGroup.id, blockchainId })
  //         )
  //       }
  //     }
  //   }
  // }

  // Steps:
  // 1. Skip if counterparty is another wallet
  // 2. SoftDelete FinancialTransactionChildMetadata entry
  // 3. SoftDelete FinancialTransactionChild entry
  // 4. SoftDelete parent or update parent activity
  // 5. Trigger gain loss workflow update for the group + chain (upstream)
  async deleteByOrganizationIdAndAddress(params: { organizationId: string; wallet: Wallet }) {
    if (!params.wallet.address || !params.wallet.walletGroup?.id) {
      this.logger.error('deleteByOrganizationIdAndAddress require a valid wallet with address and groupId', params)
    }

    const wallets = await this.walletsService.getAllByOrganizationId(params.organizationId, { walletGroup: true })
    const remainingAddresses = new Set<string>()
    for (const wallet of wallets) {
      if (wallet.address !== params.wallet.address.toLowerCase()) {
        remainingAddresses.add(wallet.address)
      }
    }

    const children = await this.getAllChildrenFromAddress({
      organizationId: params.organizationId,
      address: params.wallet.address,
      relations: { financialTransactionChildMetadata: true, financialTransactionParent: true }
    })

    const affectedWalletAddresses = new Set<string>()
    const deletedParentIds = new Set<string>()

    for (const child of children) {
      // The transactions are not deleted only if the counterparty is another wallet and of the opposite leg of the transaction
      if (
        child.fromAddress === params.wallet.address &&
        remainingAddresses.has(child.toAddress) &&
        (child.financialTransactionChildMetadata.type === FinancialTransactionChildMetadataType.DEPOSIT_INTERNAL ||
          child.financialTransactionChildMetadata.type === FinancialTransactionChildMetadataType.DEPOSIT_GROUP)
      ) {
        affectedWalletAddresses.add(child.toAddress)
        continue
      }

      if (
        child.toAddress === params.wallet.address &&
        remainingAddresses.has(child.fromAddress) &&
        (child.financialTransactionChildMetadata.type === FinancialTransactionChildMetadataType.WITHDRAWAL_INTERNAL ||
          child.financialTransactionChildMetadata.type === FinancialTransactionChildMetadataType.WITHDRAWAL_GROUP)
      ) {
        affectedWalletAddresses.add(child.fromAddress)
        continue
      }

      await this.financialTransactionChildMetadataRepository.softDelete({ financialTransactionChild: { id: child.id } })
      await this.financialTransactionChildRepository.softDelete(child.id)
      deletedParentIds.add(child.financialTransactionParent.id)
    }

    for (const deletedParentId of deletedParentIds) {
      const parent = await this.financialTransactionParentRepository.findOne({
        where: { id: deletedParentId },
        relations: {
          financialTransactionChild: true
        }
      })

      if (!parent.financialTransactionChild?.length) {
        await this.financialTransactionParentRepository.softDelete(parent.id)
      } else {
        const fromCount = parent.financialTransactionChild
          .map((child) => remainingAddresses.has(child.fromAddress))
          .filter((flag) => flag === true).length
        const toCount = parent.financialTransactionChild
          .map((child) => remainingAddresses.has(child.toAddress))
          .filter((flag) => flag === true).length

        const parentActivity = this.getParentActivity({ fromCount, toCount })
        await this.financialTransactionParentRepository.update(parent.id, { activity: parentActivity })
      }
    }

    return affectedWalletAddresses
  }

  async getAllFiles(param: { organizationId: string; childPublicId: string }) {
    const child = await this.getChildByOrganizationIdAndPublicId({
      organizationId: param.organizationId,
      publicId: param.childPublicId
    })

    return this.financialTransactionFileRepository.find({
      where: {
        organizationId: param.organizationId,
        financialTransactionChildId: child?.id ?? null
      }
    })
  }

  async getChildByHashAndOrganization(hash: string, organizationId: string): Promise<FinancialTransactionChild[]> {
    return this.financialTransactionChildRepository.find({
      where: {
        hash: ILike(hash),
        organizationId
      },
      relations: {
        financialTransactionChildMetadata: {
          category: true
        }
      }
    })
  }

  async getAllUnpopulatedGnosisChild(params: { organizationId: string; address: string; blockchainId: string }) {
    return this.financialTransactionChildRepository.find({
      where: {
        organizationId: params.organizationId,
        blockchainId: params.blockchainId,
        fromAddress: params.address.toLowerCase(),
        financialTransactionChildMetadata: {
          gnosisMetadata: IsNull()
        }
      },
      relations: {
        financialTransactionChildMetadata: true
      }
    })
  }

  softDeleteFile(id: string) {
    return this.financialTransactionFileRepository.softDelete(id)
  }

  updateGnosisChildMetadata(id: string, gnosisMetadata: FinancialTransactionChildGnosisMetadata) {
    return this.financialTransactionChildMetadataRepository.update(id, {
      gnosisMetadata
    })
  }
}
