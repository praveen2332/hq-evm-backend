import { Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { dateHelper } from '../common/helpers/date.helper'
import { LoggerService } from '../common/logger/logger.service'
import { AdditionalTransformationPerWalletGroupTask } from '../common/services/additional-transformation-per-wallet-group-tasks/additional-transformation-per-wallet-group-task.entity'
import { AdditionalTransformationPerWalletGroupTasksService } from '../common/services/additional-transformation-per-wallet-group-tasks/additional-transformation-per-wallet-group-tasks.service'
import { FinancialTransactionChild } from '../common/services/financial-transactions/financial-transaction-child.entity'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import {
  FinancialTransactionChildMetadataDirection,
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataSubstatus,
  GainLossInclusionStatus
} from '../common/services/financial-transactions/interfaces'
import { GainsLossesService } from '../common/services/gains-losses/gains-losses.service'
import {
  CostBasisCalculationMethod,
  CreateTaxLotDto,
  CreateTaxLotSaleDto,
  GetAvailableTaxLotDto,
  TaxLotStatus
} from '../common/services/gains-losses/interfaces'
import { TaxLotSale } from '../common/services/gains-losses/tax-lot-sale.entity'
import { TaxLot } from '../common/services/gains-losses/tax-lot.entity'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { TaskStatusEnum } from '../core/events/event-types'

@Injectable()
export class AdditionalTransformationsPerWalletGroupDomainService {
  constructor(
    private additionalTransformationPerWalletGroupTasksService: AdditionalTransformationPerWalletGroupTasksService,
    private financialTransactionsService: FinancialTransactionsEntityService,
    private gainsLossesService: GainsLossesService,
    private readonly walletsService: WalletsService,
    private readonly logger: LoggerService
  ) {}

  async executeWorkflow(task: AdditionalTransformationPerWalletGroupTask) {
    if (task.metadata?.gainLossWorkflowStatus != TaskStatusEnum.COMPLETED) {
      const lastProcessedChildId = await this.executeGainLossWorkflow({
        walletGroupId: task.walletGroupId,
        blockchainId: task.blockchainId,
        organizationId: task.organizationId,
        lastCompletedFinancialTransactionChildId: task.metadata?.lastCompletedFinancialTransactionChildId
      })
      task.metadata.gainLossWorkflowStatus = TaskStatusEnum.COMPLETED
      await this.additionalTransformationPerWalletGroupTasksService.updateMetadata(task.id, {
        ...task.metadata,
        lastCompletedFinancialTransactionChildId: lastProcessedChildId
      })
    }

    await this.additionalTransformationPerWalletGroupTasksService.changeStatus(task.id, TaskStatusEnum.COMPLETED)
  }

  async executeGainLossWorkflow(params: {
    walletGroupId: string
    blockchainId: string
    organizationId: string
    lastCompletedFinancialTransactionChildId: string
  }) {
    const wallets = await this.walletsService.getAllByOrganizationIdAndWalletGroupId(
      params.organizationId,
      params.walletGroupId
    )

    const walletsMapGroupedByAddress: Map<string, Wallet> = new Map<string, Wallet>()
    const addresses: string[] = []

    for (const wallet of wallets) {
      walletsMapGroupedByAddress.set(wallet.address, wallet)
      addresses.push(wallet.address)
    }

    if (!params.lastCompletedFinancialTransactionChildId) {
      for (const wallet of wallets) {
        await this.gainsLossesService.deleteTaxLotSaleByWalletIdAndBlockchainId(wallet.id, params.blockchainId, true)
        await this.gainsLossesService.deleteTaxLotByWalletIdAndBlockchainId(wallet.id, params.blockchainId, true)
      }
    }

    let highestCompletedFinancialTransactionChildId = params.lastCompletedFinancialTransactionChildId ?? '0'

    const ownedCryptocurrencies =
      await this.financialTransactionsService.getCryptocurrenciesByAddressesAndBlockchainAndOrganization(
        addresses,
        params.blockchainId,
        params.organizationId,
        params.lastCompletedFinancialTransactionChildId
      )

    for (const { cryptocurrency_id } of ownedCryptocurrencies) {
      const financialTransactionChildren =
        await this.financialTransactionsService.getAllChildrenByAddressesAndBlockchainIdAndCryptocurrencyId({
          addresses,
          blockchainId: params.blockchainId,
          organizationId: params.organizationId,
          cryptocurrencyId: cryptocurrency_id,
          lastCompletedFinancialTransactionChildId: params.lastCompletedFinancialTransactionChildId
        })

      if (financialTransactionChildren.length) {
        const internalChildMap: Map<string, FinancialTransactionChild> = new Map<string, FinancialTransactionChild>()

        for (const child of financialTransactionChildren) {
          const metadata = child.financialTransactionChildMetadata
          const completedChildren = []

          if (metadata.gainLossInclusionStatus === GainLossInclusionStatus.ALL) {
            await this.gainLossInclusionAllWorfklow(child, walletsMapGroupedByAddress)
            completedChildren.push(child)
          } else if (metadata.gainLossInclusionStatus === GainLossInclusionStatus.INTERNAL) {
            const internalUniqueId = child.publicId.slice(0, 30)
            const childPair = internalChildMap.get(internalUniqueId)
            if (childPair) {
              await this.gainLossInclusionInternalWorfklow(child, childPair, walletsMapGroupedByAddress)
              completedChildren.push(child)
              completedChildren.push(childPair)
              internalChildMap.delete(internalUniqueId)
            } else {
              internalChildMap.set(internalUniqueId, child)
            }
          } else {
            this.logger.error(`Unimplemented gain loss inclusion status in gainLossWorkflow for child ${child.id}`)
          }

          for (const completedChild of completedChildren) {
            await this.financialTransactionsService.updateChildIdWithStatus(
              completedChild.id,
              FinancialTransactionChildMetadataStatus.SYNCED
            )
          }
        }

        if (
          new Decimal(financialTransactionChildren.at(-1).id).greaterThan(highestCompletedFinancialTransactionChildId)
        ) {
          highestCompletedFinancialTransactionChildId = financialTransactionChildren.at(-1).id
        }

        if (internalChildMap.size !== 0) {
          this.logger.error(`Gain loss worfklow internalChildPair is not fully consumed`, internalChildMap)
        }
      }
    }

    return highestCompletedFinancialTransactionChildId === '0' ? null : highestCompletedFinancialTransactionChildId
  }

  async gainLossInclusionAllWorfklow(
    child: FinancialTransactionChild,
    walletsMapGroupedByAddress: Map<string, Wallet>
  ) {
    const metadata = child.financialTransactionChildMetadata
    const updatedBy = 'service_gain_loss_inclusion_all_workflow'
    if (metadata.direction === FinancialTransactionChildMetadataDirection.INCOMING) {
      const wallet = walletsMapGroupedByAddress.get(child.toAddress)

      const createTaxLotDto: CreateTaxLotDto = {
        financialTransactionChildId: child.id,
        cryptocurrency: child.cryptocurrency,
        blockchainId: child.blockchainId,
        amountTotal: child.cryptocurrencyAmount,
        amountAvailable: child.cryptocurrencyAmount,
        status: TaxLotStatus.AVAILABLE,
        statusReason: null,
        purchasedAt: child.valueTimestamp,
        transferredAt: child.valueTimestamp,
        costBasisAmount: child.financialTransactionChildMetadata.fiatAmount,
        costBasisPerUnit: child.financialTransactionChildMetadata.fiatAmountPerUnit,
        costBasisFiatCurrency: child.financialTransactionChildMetadata.fiatCurrency,
        walletId: wallet.id,
        organizationId: child.organizationId,
        updatedBy: 'service_gain_loss_workflow',
        previousTaxLotSaleId: null
      }

      await this.gainsLossesService.createOrUpdateTaxLot(createTaxLotDto)
    } else if (metadata.direction === FinancialTransactionChildMetadataDirection.OUTGOING) {
      const wallet = walletsMapGroupedByAddress.get(child.fromAddress)

      await this.processOutgoingChildWorkflow(child, wallet.id, updatedBy, false)
    }
  }

  async gainLossInclusionInternalWorfklow(
    firstChild: FinancialTransactionChild,
    secondChild: FinancialTransactionChild,
    walletsMapGroupedByAddress: Map<string, Wallet>
  ) {
    if (firstChild.publicId.slice(0, 30) !== secondChild.publicId.slice(0, 30)) {
      this.logger.error(`Internal child pair does not match ${firstChild.id} and ${secondChild.id}`)
      return
    }

    const incomingChild =
      firstChild.financialTransactionChildMetadata.direction === FinancialTransactionChildMetadataDirection.INCOMING
        ? firstChild
        : secondChild
    const outgoingChild =
      secondChild.financialTransactionChildMetadata.direction === FinancialTransactionChildMetadataDirection.OUTGOING
        ? secondChild
        : firstChild

    if (incomingChild.id === outgoingChild.id) {
      this.logger.error(
        `Internal child pair has the same direction: ${firstChild.id}:${firstChild.financialTransactionChildMetadata.direction} and ${secondChild.id}:${secondChild.financialTransactionChildMetadata.direction}`
      )
      return
    }

    const updatedBy = 'service_gain_loss_inclusion_internal_workflow'

    const outgoingWallet = walletsMapGroupedByAddress.get(outgoingChild.fromAddress)

    const taxLotSales: TaxLotSale[] = await this.processOutgoingChildWorkflow(
      outgoingChild,
      outgoingWallet.id,
      updatedBy,
      true
    )

    if (taxLotSales.length) {
      const incomingWallet = walletsMapGroupedByAddress.get(incomingChild.toAddress)
      for (const taxLotSale of taxLotSales) {
        const createTaxLotDto: CreateTaxLotDto = {
          financialTransactionChildId: incomingChild.id,
          cryptocurrency: incomingChild.cryptocurrency,
          blockchainId: incomingChild.blockchainId,
          amountTotal: taxLotSale.soldAmount,
          amountAvailable: taxLotSale.soldAmount,
          status: TaxLotStatus.AVAILABLE,
          statusReason: null,
          purchasedAt: taxLotSale.taxLot.purchasedAt,
          transferredAt: incomingChild.valueTimestamp,
          costBasisAmount: incomingChild.financialTransactionChildMetadata.fiatAmount,
          costBasisPerUnit: incomingChild.financialTransactionChildMetadata.fiatAmountPerUnit,
          costBasisFiatCurrency: incomingChild.financialTransactionChildMetadata.fiatCurrency,
          walletId: incomingWallet.id,
          organizationId: incomingChild.organizationId,
          updatedBy: updatedBy,
          previousTaxLotSaleId: taxLotSale.id
        }

        await this.gainsLossesService.createOrUpdateInternalTaxLot(createTaxLotDto)
      }
    }
  }

  async processOutgoingChildWorkflow(
    child: FinancialTransactionChild,
    walletId: string,
    updatedBy: string,
    isInternal: boolean = false
  ) {
    const metadata = child.financialTransactionChildMetadata

    const getAvailableTaxLotDto: GetAvailableTaxLotDto = {
      financialTransactionChildId: child.id,
      cryptocurrency: child.cryptocurrency,
      blockchainId: child.blockchainId,
      walletId: walletId,
      organizationId: child.organizationId,
      updatedBy: updatedBy,
      amountRequested: child.cryptocurrencyAmount,
      soldAt: child.valueTimestamp,
      costBasisCalculationMethod: CostBasisCalculationMethod.FIFO
    }

    const taxLots: TaxLot[] = await this.gainsLossesService.getAvailableTaxLotsFromDto(getAvailableTaxLotDto)

    const amountRequested = new Decimal(child.cryptocurrencyAmount)
    let currentSum = new Decimal(0)
    const taxLotSales: TaxLotSale[] = []

    for (const taxLot of taxLots) {
      currentSum = Decimal.add(currentSum, taxLot.amountAvailable)

      const createTaxLotSaleDto: CreateTaxLotSaleDto = {
        taxLot: taxLot,
        soldAmount: taxLot.amountAvailable,
        soldAt: child.valueTimestamp,
        financialTransactionChildId: child.id,
        cryptocurrency: child.cryptocurrency,
        blockchainId: child.blockchainId,
        walletId: walletId,
        organizationId: child.organizationId,
        updatedBy: updatedBy
      }

      if (currentSum.greaterThanOrEqualTo(amountRequested)) {
        const originalCurrentSum = Decimal.sub(currentSum, taxLot.amountAvailable)
        const soldAmount = Decimal.sub(amountRequested, originalCurrentSum)

        createTaxLotSaleDto.soldAmount = soldAmount.toString()

        const taxLotSale = await this.gainsLossesService.createTaxLotSale(createTaxLotSaleDto, isInternal)
        taxLotSales.push(taxLotSale)
        break
      } else {
        const taxLotSale = await this.gainsLossesService.createTaxLotSale(createTaxLotSaleDto, isInternal)
        taxLotSales.push(taxLotSale)
      }
    }

    const costBasis = isInternal
      ? null
      : taxLotSales.reduce(
          (sum, curr) => Decimal.add(sum, Decimal.mul(curr.costBasisPerUnit, curr.soldAmount)),
          new Decimal(0)
        )
    metadata.costBasis = costBasis ? costBasis.toString() : null
    metadata.costBasisUpdatedAt = dateHelper.getUTCTimestamp()
    metadata.costBasisUpdatedBy = updatedBy
    if (currentSum.comparedTo(amountRequested) < 0) {
      this.financialTransactionsService.addSubstatusToChildMetadata(
        FinancialTransactionChildMetadataSubstatus.MISSING_COST_BASIS,
        metadata
      )
    } else {
      this.financialTransactionsService.removeSubstatusFromChildMetadata(
        FinancialTransactionChildMetadataSubstatus.MISSING_COST_BASIS,
        metadata
      )
    }
    metadata.gainLoss = isInternal ? null : Decimal.sub(metadata.fiatAmount, costBasis).toString()

    await this.financialTransactionsService.updateChildMetadata(metadata.id, metadata)

    return taxLotSales
  }
}
