import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { setTimeout } from 'timers/promises'
import { dateHelper } from '../../common/helpers/date.helper'
import { LoggerService } from '../../common/logger/logger.service'
import { AdditionalTransformationPerWalletGroupTasksService } from '../../common/services/additional-transformation-per-wallet-group-tasks/additional-transformation-per-wallet-group-tasks.service'
import { AdditionalTransformationPerWalletTasksService } from '../../common/services/additional-transformation-per-wallet-tasks/additional-transformation-per-wallet-tasks.service'
import { CoreTransformationTasksService } from '../../common/services/core-transformation-tasks/core-transformation-tasks.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { WalletStatusesEnum } from '../../common/services/wallets/interfaces'
import { WalletsService } from '../../common/services/wallets/wallets.service'
import { TaskStatusEnum } from '../../core/events/event-types'
import { AdditionalTransformationsPerWalletGroupDomainService } from '../additional-transformations-per-wallet-group.domain.service'
import { AdditionalTransformationsPerWalletDomainService } from '../additional-transformations-per-wallet.domain.service'
import { FinancialTransformationsEventType } from '../events/events'

@Injectable()
export class AdditionalTransformationsListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private coreTransformationTasksService: CoreTransformationTasksService,
    private additionalTransformationPerWalletTasksService: AdditionalTransformationPerWalletTasksService,
    private additionalTransformationPerWalletGroupTasksService: AdditionalTransformationPerWalletGroupTasksService,
    private additionalTransformationsPerWalletDomainService: AdditionalTransformationsPerWalletDomainService,
    private additionalTransformationsPerWalletGroupDomainService: AdditionalTransformationsPerWalletGroupDomainService,
    private walletsService: WalletsService,
    private featureFlagsService: FeatureFlagsService,
    private logger: LoggerService
  ) {}

  @OnEvent(FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET, {
    async: true,
    promisify: true
  })
  async handleSyncPerWalletEvent(perWalletTaskId: string) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      let task = await this.additionalTransformationPerWalletTasksService.get(perWalletTaskId)

      const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
      this.logger.log(
        `additionalTransformationPerWalletTask ${perWalletTaskId} is running for ${minutes} minutes and ${seconds} seconds for task id`
      )

      try {
        if (task.status !== TaskStatusEnum.COMPLETED) {
          await this.additionalTransformationPerWalletTasksService.changeStatus(task.id, TaskStatusEnum.RUNNING)

          await this.additionalTransformationsPerWalletDomainService.executeWorkflow(task)

          task = await this.additionalTransformationPerWalletTasksService.get(perWalletTaskId)

          if (task.status !== TaskStatusEnum.COMPLETED) {
            await setTimeout(6000)
            this.eventEmitter.emit(FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET, task.id)
          } else {
            const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
            this.logger.log(
              `additionalTransformationPerWalletTask ${perWalletTaskId} is COMPLETED after ${minutes} minutes and ${seconds} seconds`
            )
          }
        }
      } catch (e) {
        await this.additionalTransformationPerWalletTasksService.updateError(perWalletTaskId, e)
        this.logger.error(`additionalTransformationPerWalletTask ${perWalletTaskId} has errors`, e)
      }
    }
  }

  @OnEvent(FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET_GROUP, {
    async: true,
    promisify: true
  })
  async handleSyncPerWalletGroupEvent(perWalletGroupTaskId: string) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      let task = await this.additionalTransformationPerWalletGroupTasksService.get(perWalletGroupTaskId)

      const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
      this.logger.log(
        `additionalTransformationPerWalletGroupTask ${perWalletGroupTaskId} is running for ${minutes} minutes and ${seconds} seconds`
      )

      try {
        if (task.status !== TaskStatusEnum.COMPLETED) {
          const wallets = await this.walletsService.getAllByOrganizationIdAndWalletGroupId(
            task.organizationId,
            task.walletGroupId,
            { walletGroup: true }
          )

          // Make sure the status of the sync of all the wallet in the wallet groups are completed up to this step
          let toExecuteFlag = true
          for (const wallet of wallets) {
            const runningAdditionalTransformationPerWalletTask =
              await this.additionalTransformationPerWalletTasksService.getCurrentTaskByWalletAndBlockchainAndOrganization(
                { walletId: wallet.id, blockchainId: task.blockchainId, organizationId: task.organizationId }
              )

            if (runningAdditionalTransformationPerWalletTask) {
              toExecuteFlag = false
              break
            }

            const runningCoreTask =
              await this.coreTransformationTasksService.getCurrentTaskByAddressAndBlockchainAndOrganization({
                address: wallet.address,
                blockchainId: task.blockchainId,
                organizationId: task.organizationId
              })

            if (runningCoreTask) {
              toExecuteFlag = false
              break
            }
          }

          if (toExecuteFlag) {
            await this.additionalTransformationPerWalletGroupTasksService.changeStatus(task.id, TaskStatusEnum.RUNNING)
            await this.additionalTransformationsPerWalletGroupDomainService.executeWorkflow(task)
            task = await this.additionalTransformationPerWalletGroupTasksService.get(perWalletGroupTaskId)
          }

          if (task.status !== TaskStatusEnum.COMPLETED) {
            await setTimeout(4000)
            this.eventEmitter.emit(
              FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET_GROUP,
              task.id
            )
          } else {
            for (const wallet of wallets) {
              await this.walletsService.updateChainStatusByAddress(
                {
                  blockchainId: task.blockchainId,
                  organizationId: task.organizationId,
                  address: wallet.address
                },
                WalletStatusesEnum.SYNCED
              )
            }

            const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
            this.logger.log(
              `additionalTransformationPerWalletGroupTask ${perWalletGroupTaskId} is COMPLETED after ${minutes} minutes and ${seconds} seconds`
            )
          }
        }
      } catch (e) {
        await this.additionalTransformationPerWalletGroupTasksService.updateError(perWalletGroupTaskId, e)
        this.logger.error(`additionalTransformationPerWalletGroupTask ${perWalletGroupTaskId} has errors`, e)
      }
    }
  }
}
