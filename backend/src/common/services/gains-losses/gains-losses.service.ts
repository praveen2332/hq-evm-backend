import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import Decimal from 'decimal.js'
import {
  FindManyOptions,
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  Repository
} from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Direction, PaginationParams } from '../../../core/interfaces'
import { dateHelper } from '../../helpers/date.helper'
import {
  CostBasisCalculationMethod,
  CreateTaxLotDto,
  CreateTaxLotSaleDto,
  GetAvailableTaxLotDto,
  TaxLotStatus
} from './interfaces'
import { TaxLotSale, TaxLotSaleAuditMetadata } from './tax-lot-sale.entity'
import { TaxLot, TaxLotAuditMetadata } from './tax-lot.entity'

@Injectable()
export class GainsLossesService extends BaseService<TaxLot> {
  constructor(
    @InjectRepository(TaxLot)
    private taxLotRepository: Repository<TaxLot>,
    @InjectRepository(TaxLotSale)
    private taxLotSaleRepository: Repository<TaxLotSale>
  ) {
    super(taxLotRepository)
  }

  async createOrUpdateTaxLot(dto: CreateTaxLotDto) {
    const auditMetadata: TaxLotAuditMetadata = {
      amountAvailable: dto.amountAvailable,
      updatedAt: dateHelper.getUTCTimestamp(),
      newCostBasisPerUnit: dto.costBasisPerUnit,
      updatedBy: dto.updatedBy,
      previousCostBasisPerUnit: null,
      status: dto.status,
      statusReason: dto.statusReason
    }

    const newTaxLot: TaxLot = TaxLot.createFromDto(dto, auditMetadata)
    const whereCondition: FindOptionsWhere<TaxLot> = { financialTransactionChildId: dto.financialTransactionChildId }
    const exist = await this.taxLotRepository.findOne({
      where: whereCondition
    })

    if (!exist) {
      await this.taxLotRepository.save(newTaxLot)
    } else {
      auditMetadata.amountAvailable = exist.amountAvailable
      auditMetadata.previousCostBasisPerUnit = exist.costBasisPerUnit

      const updateData: Partial<TaxLot> = {
        status: dto.status,
        statusReason: dto.statusReason,
        costBasisAmount: dto.costBasisAmount,
        costBasisPerUnit: dto.costBasisPerUnit,
        previousTaxLotSaleId: dto.previousTaxLotSaleId,
        transferredAt: dto.transferredAt,
        auditMetadataList: (exist.auditMetadataList ?? []).concat(auditMetadata)
      }

      await this.taxLotRepository.update(exist.id, updateData)
    }
  }

  async createOrUpdateInternalTaxLot(dto: CreateTaxLotDto) {
    const auditMetadata: TaxLotAuditMetadata = {
      amountAvailable: dto.amountAvailable,
      updatedAt: dateHelper.getUTCTimestamp(),
      newCostBasisPerUnit: dto.costBasisPerUnit,
      updatedBy: dto.updatedBy,
      previousCostBasisPerUnit: null,
      status: dto.status,
      statusReason: dto.statusReason
    }

    const newTaxLot: TaxLot = TaxLot.createFromDto(dto, auditMetadata)
    const whereCondition: FindOptionsWhere<TaxLot> = {
      financialTransactionChildId: dto.financialTransactionChildId,
      previousTaxLotSaleId: dto.previousTaxLotSaleId
    }
    const exist = await this.taxLotRepository.findOne({
      where: whereCondition
    })

    if (!exist) {
      await this.taxLotRepository.save(newTaxLot)
    } else {
      auditMetadata.amountAvailable = exist.amountAvailable
      auditMetadata.previousCostBasisPerUnit = exist.costBasisPerUnit

      const updateData: Partial<TaxLot> = {
        status: dto.status,
        statusReason: dto.statusReason,
        costBasisAmount: dto.costBasisAmount,
        costBasisPerUnit: dto.costBasisPerUnit,
        previousTaxLotSaleId: dto.previousTaxLotSaleId,
        transferredAt: dto.transferredAt,
        auditMetadataList: (exist.auditMetadataList ?? []).concat(auditMetadata)
      }

      await this.taxLotRepository.update(exist.id, updateData)
    }
  }

  async sellTaxLot(taxLot: TaxLot, soldAmount: string) {
    const update = {}

    const updatedAmount = Decimal.sub(taxLot.amountAvailable, soldAmount)
    update['amountAvailable'] = updatedAmount.toString()

    //TODO: handle case when updatedAmount < 0
    if (updatedAmount.equals(0)) {
      update['status'] = TaxLotStatus.SOLD
    }

    await this.taxLotRepository.update(taxLot.id, update)
  }

  async createTaxLotSale(dto: CreateTaxLotSaleDto, isInternal: boolean = false) {
    //TODO: error handling
    await this.sellTaxLot(dto.taxLot, dto.soldAmount)

    const exist = await this.taxLotSaleRepository.findOne({
      where: {
        financialTransactionChildId: dto.financialTransactionChildId,
        taxLot: { id: dto.taxLot.id },
        soldAmount: dto.soldAmount
      },
      withDeleted: true
    })

    const taxLotSale: TaxLotSale = TaxLotSale.createFromDto(dto, isInternal)

    const auditMetadata: TaxLotSaleAuditMetadata = {
      updatedAt: new Date(Date.now()),
      newCostBasisPerUnit: taxLotSale.costBasisPerUnit,
      newCostBasisAmount: taxLotSale.costBasisAmount,
      updatedBy: dto.updatedBy,
      previousCostBasisPerUnit: null,
      previousCostBasisAmount: null
    }

    taxLotSale.auditMetadataList.push(auditMetadata)

    let createdTaxLotSaleId = exist?.id

    if (!exist) {
      createdTaxLotSaleId = (await this.taxLotSaleRepository.save(taxLotSale)).id
    } else {
      if (exist.deletedAt !== null) {
        await this.taxLotSaleRepository.restore(exist.id)
      }
      auditMetadata.previousCostBasisPerUnit = exist.costBasisPerUnit
      auditMetadata.previousCostBasisAmount = exist.costBasisAmount
      const updatedData: Partial<TaxLotSale> = taxLotSale
      updatedData.auditMetadataList = exist.auditMetadataList.concat(auditMetadata)
      await this.taxLotSaleRepository.update(exist.id, updatedData)
    }
    return this.taxLotSaleRepository.findOne({ where: { id: createdTaxLotSaleId }, relations: { taxLot: true } })
  }

  async getAvailableTaxLotsFromDto(dto: GetAvailableTaxLotDto): Promise<TaxLot[]> {
    const allTaxLots = await this.taxLotRepository.find({
      where: {
        purchasedAt: LessThanOrEqual(dto.soldAt),
        status: TaxLotStatus.AVAILABLE,
        cryptocurrency: {
          id: dto.cryptocurrency.id
        },
        blockchainId: dto.blockchainId,
        walletId: dto.walletId,
        organizationId: dto.organizationId
      },
      order: {
        id: Direction.ASC
      }
    })

    if (dto.costBasisCalculationMethod === CostBasisCalculationMethod.FIFO) {
      allTaxLots.sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime())
    } else if (dto.costBasisCalculationMethod === CostBasisCalculationMethod.LIFO) {
      allTaxLots.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
    }

    return allTaxLots
  }

  getTaxLotByChildId(childId: string, relations: FindOptionsRelations<TaxLot> = {}) {
    return this.taxLotRepository.findOne({
      where: { financialTransactionChildId: childId },
      relations: relations
    })
  }

  getAvailableTaxLots(organizationId: string, blockchainIds?: string[], nameOrSymbol?: string) {
    const individualWhereConditions: FindOptionsWhere<TaxLot> = {
      status: TaxLotStatus.AVAILABLE,
      organizationId: organizationId
    }

    if (blockchainIds?.length > 0) {
      individualWhereConditions.blockchainId = In(blockchainIds)
    }

    let whereConditions = null

    if (nameOrSymbol) {
      whereConditions = [
        {
          ...individualWhereConditions,
          cryptocurrency: [{ symbol: ILike(`%${nameOrSymbol}%`) }, { name: ILike(`%${nameOrSymbol}%`) }]
        }
      ]
    } else {
      whereConditions = { ...individualWhereConditions }
    }

    return this.taxLotRepository.find({
      where: whereConditions,
      relations: { cryptocurrency: { addresses: true } }
    })
  }

  getOneSoldTaxLotForCryptocurrency(organizationId: string, blockchainIds?: string[], nameOrSymbol?: string) {
    let whereQuery = 'tl.organization_id = :organizationId AND tl.status = :status'

    if (blockchainIds?.length) {
      whereQuery += ' AND tl.blockchain_id IN (:...blockchainIds)'
    }

    if (nameOrSymbol) {
      whereQuery += ' AND (crypto.name ILIKE :nameOrSymbol OR crypto.symbol ILIKE :nameOrSymbol)'
    }

    const subQuery = this.taxLotRepository
      .createQueryBuilder()
      .subQuery()
      .select('tl.id')
      .from(TaxLot, 'tl')
      .leftJoin('tl.cryptocurrency', 'crypto')
      .where(whereQuery)
      .distinctOn(['tl.cryptocurrency_id'])

    return this.taxLotRepository
      .createQueryBuilder('taxLot')
      .leftJoinAndSelect('taxLot.cryptocurrency', 'cryptocurrency')
      .leftJoinAndSelect('cryptocurrency.addresses', 'address')
      .where(`taxLot.id in ${subQuery.getQuery()}`, {
        organizationId,
        blockchainIds,
        nameOrSymbol,
        status: TaxLotStatus.SOLD
      })
      .getMany()
  }

  async getAllTaxLotsAndCount(
    organizationId: string,
    cryptocurrencyPublicId: string,
    options: PaginationParams,
    walletIds?: string[],
    blockchainId?: string,
    status?: TaxLotStatus
  ) {
    const size = options.size || 10
    const page = options.page || 0
    const order = options.order || 'purchasedAt'
    const direction = options.direction || Direction.ASC

    let where: FindOptionsWhere<TaxLot> = {
      organizationId: organizationId,
      cryptocurrency: { publicId: cryptocurrencyPublicId },
      status: status ? status : In([TaxLotStatus.AVAILABLE, TaxLotStatus.SOLD])
    }
    if (walletIds?.length) {
      where.walletId = In(walletIds)
    }

    if (blockchainId) {
      where.blockchainId = blockchainId
    }

    const [items, total] = await this.taxLotRepository.findAndCount({
      where,
      relations: ['cryptocurrency', 'cryptocurrency.addresses'],
      order: {
        [order]: direction
      },
      take: size,
      skip: page * size
    } as FindManyOptions<TaxLot>)

    return {
      totalItems: total,
      totalPages: Math.ceil(total / size),
      currentPage: page,
      items,
      limit: size
    }
  }

  deleteTaxLotByWalletIdAndBlockchainId(walletId: string, blockchainId: string, isHardDelete: boolean = false) {
    const whereCondition: FindOptionsWhere<TaxLot> = { walletId: walletId, blockchainId: blockchainId }
    if (isHardDelete) {
      return this.taxLotRepository.delete(whereCondition)
    }
    return this.taxLotRepository.softDelete(whereCondition)
  }

  deleteTaxLotSaleByWalletIdAndBlockchainId(walletId: string, blockchainId: string, isHardDelete: boolean = false) {
    const whereCondition: FindOptionsWhere<TaxLotSale> = { walletId: walletId, blockchainId: blockchainId }
    if (isHardDelete) {
      return this.taxLotSaleRepository.delete(whereCondition)
    }
    return this.taxLotSaleRepository.softDelete(whereCondition)
  }

  getByFinancialTransactionChildIdsAndStatuses(
    childIds: string[],
    statuses: TaxLotStatus[],
    relations: FindOptionsRelations<TaxLot> = {}
  ) {
    return this.taxLotRepository.find({
      where: { financialTransactionChildId: In(childIds), status: In(statuses) },
      relations
    })
  }

  async recalculateTaxLotsByWalletIdAndBlockchainId(params: { walletId: string; blockchainId: string }) {
    await this.taxLotSaleRepository.softDelete({ walletId: params.walletId, blockchainId: params.blockchainId })
    await this.taxLotRepository.update(
      { walletId: params.walletId, blockchainId: params.blockchainId },
      { status: TaxLotStatus.RECALCULATING, statusReason: null }
    )
  }

  getRecalculatingTaxLots(params: { walletId: string; blockchainId: string }) {
    return this.taxLotRepository.find({
      where: { walletId: params.walletId, blockchainId: params.blockchainId, status: TaxLotStatus.RECALCULATING }
    })
  }

  generatePartialTaxLotForPriceUpdate(params: {
    taxLot: TaxLot
    pricePerUnit: Decimal
    fiatCurrency: string
    updatedBy: string
  }): Partial<TaxLot> {
    const taxLotUpdate: Partial<TaxLot> = {}
    const tempDate = dateHelper.getUTCTimestamp()
    taxLotUpdate.costBasisFiatCurrency = params.fiatCurrency
    taxLotUpdate.costBasisPerUnit = params.pricePerUnit.toString()
    taxLotUpdate.costBasisAmount = Decimal.mul(params.pricePerUnit, params.taxLot.amountAvailable).toString()
    const auditMetadata: TaxLotAuditMetadata = {
      updatedAt: tempDate,
      amountAvailable: params.taxLot.amountAvailable,
      newCostBasisPerUnit: taxLotUpdate.costBasisPerUnit,
      updatedBy: params.updatedBy,
      previousCostBasisPerUnit: params.taxLot.costBasisPerUnit,
      status: params.taxLot.status,
      statusReason: params.taxLot.statusReason
    }
    taxLotUpdate.auditMetadataList = params.taxLot.auditMetadataList.concat(auditMetadata)
    return taxLotUpdate
  }

  generatePartialTaxLotSaleForPriceUpdate(params: {
    taxLotSale: TaxLotSale
    pricePerUnit: Decimal
    fiatCurrency: string
    updatedBy: string
  }): Partial<TaxLotSale> {
    const taxLotSaleUpdate: Partial<TaxLotSale> = {}
    const tempDate = dateHelper.getUTCTimestamp()
    taxLotSaleUpdate.costBasisFiatCurrency = params.fiatCurrency
    taxLotSaleUpdate.costBasisPerUnit = params.pricePerUnit.toString()
    taxLotSaleUpdate.costBasisAmount = Decimal.mul(params.pricePerUnit, params.taxLotSale.soldAmount).toString()
    taxLotSaleUpdate.costBasisUpdatedBy = params.updatedBy
    const auditMetadata: TaxLotSaleAuditMetadata = {
      updatedAt: tempDate,
      newCostBasisPerUnit: taxLotSaleUpdate.costBasisPerUnit,
      newCostBasisAmount: taxLotSaleUpdate.costBasisAmount,
      updatedBy: taxLotSaleUpdate.costBasisUpdatedBy,
      previousCostBasisPerUnit: params.taxLotSale.costBasisPerUnit,
      previousCostBasisAmount: params.taxLotSale.costBasisAmount
    }
    taxLotSaleUpdate.auditMetadataList = params.taxLotSale.auditMetadataList.concat(auditMetadata)

    return taxLotSaleUpdate
  }

  async updateTaxLot(id: string, updateData: Partial<TaxLot>) {
    if (!updateData.auditMetadataList) {
      const taxLot = await this.taxLotRepository.findOne({ where: { id } })
      const tempDate = dateHelper.getUTCTimestamp()
      const auditMetadata: TaxLotAuditMetadata = {
        updatedAt: tempDate,
        amountAvailable: taxLot.amountAvailable,
        newCostBasisPerUnit: null,
        updatedBy: null,
        previousCostBasisPerUnit: null,
        status: taxLot.status,
        statusReason: taxLot.statusReason
      }
      updateData.auditMetadataList = taxLot.auditMetadataList.concat(auditMetadata)
    }

    return this.taxLotRepository.update(id, updateData)
  }

  async updateTaxLotSale(id: string, updateData: Partial<TaxLotSale>) {
    if (!updateData.auditMetadataList) {
      const taxLotSale = await this.taxLotSaleRepository.findOne({ where: { id } })
      const tempDate = dateHelper.getUTCTimestamp()
      const auditMetadata: TaxLotSaleAuditMetadata = {
        updatedAt: tempDate,
        newCostBasisPerUnit: null,
        updatedBy: null,
        previousCostBasisPerUnit: null,
        newCostBasisAmount: null,
        previousCostBasisAmount: null
      }
      updateData.auditMetadataList = taxLotSale.auditMetadataList.concat(auditMetadata)
    }
    return this.taxLotSaleRepository.update(id, updateData)
  }

  // TODO: Descoped for now. Should be enabled by May '23
  // async getRevalueTaxLotsAndSale(
  //   organizationId: string,
  //   purchaseAfter: Date,
  //   chainIds?: number[]
  // ): Promise<{ revalueTaxLotsGroup: { [lotId: string]: TaxLot }; taxLotSaleGroup: { [saleId: string]: string } }> {
  //   const saleWhereConditions = { soldAt: MoreThan(purchaseAfter), organizationId: organizationId }
  //   const whereConditions = {
  //     status: TaxLotStatus.AVAILABLE,
  //     purchasedAt: MoreThan(purchaseAfter),
  //     organizationId: organizationId
  //   }

  //   if (chainIds?.length) {
  //     saleWhereConditions['chainIds'] = In(chainIds)
  //     whereConditions['chainIds'] = In(chainIds)
  //   }

  //   const taxLotSales = await this.taxLotSaleRepository.find({
  //     where: saleWhereConditions,
  //     relations: ['cryptocurrency', 'cryptocurrency.addresses']
  //   })

  //   const taxLots = await this.taxLotRepository.find({
  //     where: whereConditions,
  //     relations: ['cryptocurrency', 'cryptocurrency.addresses']
  //   })

  //   const revalueTaxLotsGroup: { [lotId: string]: TaxLot } = {}

  //   for (const lot of taxLots) {
  //     revalueTaxLotsGroup[lot.id] = lot
  //   }

  //   const taxLotSaleGroup: { [saleId: string]: string } = {}

  //   for (const taxLotSale of taxLotSales) {
  //     const taxLotId = taxLotSale.taxLot.id
  //     const taxLot = revalueTaxLotsGroup[taxLotId] ?? null

  //     if (taxLot) {
  //       taxLot.amountAvailable = Decimal.add(taxLot.amountAvailable, taxLotSale.soldAmount).toString()
  //       revalueTaxLotsGroup[taxLotId] = taxLot
  //     } else {
  //       const taxLot = await this.taxLotRepository.findOne({
  //         where: { id: taxLotId },
  //         relations: ['cryptocurrency', 'cryptocurrency.addresses']
  //       })
  //       taxLot.amountAvailable = taxLotSale.soldAmount
  //       revalueTaxLotsGroup[taxLotId] = taxLot
  //     }

  //     taxLotSaleGroup[taxLotSale.id] = taxLotSale.soldAmount
  //   }

  //   return { revalueTaxLotsGroup, taxLotSaleGroup }
  // }
}
