import { Injectable } from '@nestjs/common'
import { String } from 'aws-sdk/clients/appstream'
import { groupBy } from 'lodash'
import { LoggerService } from '../common/logger/logger.service'
import { AdditionalTransformationPerWalletTask } from '../common/services/additional-transformation-per-wallet-tasks/additional-transformation-per-wallet-task.entity'
import { AdditionalTransformationPerWalletTasksService } from '../common/services/additional-transformation-per-wallet-tasks/additional-transformation-per-wallet-tasks.service'
import {
  FinancialTransactionChildGnosisMetadata,
  FinancialTransactionChildMetadata,
  FinancialTransactionGnosisConfirmation
} from '../common/services/financial-transactions/financial-transaction-child-metadata.entity'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import {
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataSubstatus,
  GainLossInclusionStatus
} from '../common/services/financial-transactions/interfaces'
import { GnosisProviderService } from '../common/services/general/gnosis/gnosis-provider.service'
import { GnosisMultisigTransaction } from '../common/services/general/gnosis/interfaces'
import { OrganizationSettingsService } from '../common/services/organization-settings/organization-settings.service'
import { TaskStatusEnum } from '../core/events/event-types'
import { PricesService } from '../prices/prices.service'

@Injectable()
export class AdditionalTransformationsPerWalletDomainService {
  constructor(
    private additionalTransformationPerWalletTasksService: AdditionalTransformationPerWalletTasksService,
    private financialTransactionsService: FinancialTransactionsEntityService,
    private pricesService: PricesService,
    private organizationSettingsService: OrganizationSettingsService,
    private readonly gnosisProviderService: GnosisProviderService,
    private readonly logger: LoggerService
  ) {}

  async executeWorkflow(task: AdditionalTransformationPerWalletTask) {
    if (task.metadata?.fillMissingFiatPriceWorkflowStatus != TaskStatusEnum.COMPLETED) {
      await this.executeFillMissingFiatPriceWorkflow({
        organizationId: task.organizationId,
        address: task.address,
        blockchainId: task.blockchainId
      })
      task.metadata.fillMissingFiatPriceWorkflowStatus = TaskStatusEnum.COMPLETED
      await this.additionalTransformationPerWalletTasksService.updateMetadata(task.id, task.metadata)
    }

    if (task.metadata?.gnosisWorkflowStatus != TaskStatusEnum.COMPLETED) {
      await this.syncGnosisData(task)
      task.metadata.gnosisWorkflowStatus = TaskStatusEnum.COMPLETED
      await this.additionalTransformationPerWalletTasksService.updateMetadata(task.id, task.metadata)
    }

    await this.additionalTransformationPerWalletTasksService.changeStatus(task.id, TaskStatusEnum.COMPLETED)
  }

  async executeFillMissingFiatPriceWorkflow(params: { address: string; organizationId: string; blockchainId: String }) {
    const children = await this.financialTransactionsService.getAllChildrenFromAddressWithMissingPrice({
      ...params
    })

    const organizationSetting = await this.organizationSettingsService.getByOrganizationId(params.organizationId, {
      fiatCurrency: true
    })
    const updatedBy = 'service_fill_missing_fiat_price_workflow'

    for (const child of children) {
      if (!child.financialTransactionChildMetadata.fiatAmountPerUnit) {
        const price = await this.pricesService.getFiatPriceByCryptocurrency(
          child.cryptocurrency,
          child.valueTimestamp,
          organizationSetting.fiatCurrency.alphabeticCode
        )
        let updatedMetadata: Partial<FinancialTransactionChildMetadata> = {}

        if (price) {
          updatedMetadata = await this.financialTransactionsService.generatePartialChildMetadataForPriceUpdate({
            cryptocurrencyAmount: child.cryptocurrencyAmount,
            pricePerUnit: price,
            fiatCurrency: organizationSetting.fiatCurrency.alphabeticCode,
            updatedBy
          })
          this.financialTransactionsService.removeSubstatusFromChildMetadata(
            FinancialTransactionChildMetadataSubstatus.MISSING_PRICE,
            updatedMetadata
          )
        } else {
          this.financialTransactionsService.addSubstatusToChildMetadata(
            FinancialTransactionChildMetadataSubstatus.MISSING_PRICE,
            updatedMetadata
          )
        }

        // Need to find a better place to update this
        if (child.financialTransactionChildMetadata.gainLossInclusionStatus === GainLossInclusionStatus.NONE) {
          updatedMetadata.status = FinancialTransactionChildMetadataStatus.SYNCED
        }

        await this.financialTransactionsService.updateChildMetadata(
          child.financialTransactionChildMetadata.id,
          updatedMetadata
        )
      }
    }
  }

  private async syncGnosisData(task: AdditionalTransformationPerWalletTask) {
    const isGnosisSafe = await this.gnosisProviderService.isGnosisSafe({
      address: task.address,
      blockchainId: task.blockchainId
    })

    if (!isGnosisSafe) {
      return
    }

    const financialTransactionChildren = await this.financialTransactionsService.getAllUnpopulatedGnosisChild({
      address: task.address,
      organizationId: task.organizationId,
      blockchainId: task.blockchainId
    })
    const groupedByHash = groupBy(financialTransactionChildren, 'hash')
    for (const hash in groupedByHash) {
      try {
        const gnosisTx = await this.gnosisProviderService.getTxDetails({
          blockchainId: task.blockchainId,
          address: task.address,
          hash
        })
        if (!gnosisTx) {
          continue
        }
        const metadata = this.convertGnosisSafeTxToChildTransactionMetadata(gnosisTx)
        const financialTransactionChildren = groupedByHash[hash]
        for (const financialTransactionChild of financialTransactionChildren) {
          await this.financialTransactionsService.updateGnosisChildMetadata(
            financialTransactionChild.financialTransactionChildMetadata.id,
            metadata
          )
        }
      } catch (e) {
        this.logger.error(`Error while syncing Gnosis data for ${hash}`, e, {
          address: task.address,
          organizationId: task.organizationId,
          blockchainId: task.blockchainId
        })
      }
    }
  }

  convertGnosisSafeTxToChildTransactionMetadata(
    gnosisTx: GnosisMultisigTransaction
  ): FinancialTransactionChildGnosisMetadata {
    const confirmations: FinancialTransactionGnosisConfirmation[] = gnosisTx.confirmations.map((confirmation) => ({
      owner: confirmation.owner,
      signatureType: confirmation.signatureType,
      transactionHash: confirmation.transactionHash,
      submissionDate: confirmation.submissionDate
    }))
    return {
      safeTxHash: gnosisTx.safeTxHash,
      confirmations: confirmations,
      confirmationsRequired: gnosisTx.confirmationsRequired,
      executionDate: gnosisTx.executionDate,
      modified: gnosisTx.modified,
      submissionDate: gnosisTx.submissionDate
    }
  }
}
