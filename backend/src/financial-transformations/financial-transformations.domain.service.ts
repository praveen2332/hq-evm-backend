import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { setTimeout } from 'timers/promises'
import { LoggerService } from '../common/logger/logger.service'
import { AdditionalTransformationPerWalletGroupTasksService } from '../common/services/additional-transformation-per-wallet-group-tasks/additional-transformation-per-wallet-group-tasks.service'
import { AdditionalTransformationPerWalletTasksService } from '../common/services/additional-transformation-per-wallet-tasks/additional-transformation-per-wallet-tasks.service'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { CoreTransformationTasksService } from '../common/services/core-transformation-tasks/core-transformation-tasks.service'
import { FeatureFlagsService } from '../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../common/services/feature-flags/interfaces'
import { IngestionsService } from '../common/services/general/ingestion/ingestions.service'
import { PreprocessRawTasksService } from '../common/services/preprocess-raw-tasks/preprocess-raw-tasks.service'
import { WalletStatusesEnum } from '../common/services/wallets/interfaces'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { TaskSyncType } from '../core/events/event-types'
import { FinancialTransformationsEventType } from './events/events'

@Injectable()
export class FinancialTransformationsDomainService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private coreTransformationTasksService: CoreTransformationTasksService,
    private additionalTransformationPerWalletTasksService: AdditionalTransformationPerWalletTasksService,
    private additionalTransformationPerWalletGroupTasksService: AdditionalTransformationPerWalletGroupTasksService,
    private preprocessRawTasksService: PreprocessRawTasksService,
    private ingestionService: IngestionsService,
    private walletsService: WalletsService,
    private featureFlagsService: FeatureFlagsService,
    private blockchainsService: BlockchainsService,
    private logger: LoggerService
  ) {}

  async sync(params: { address: string; organizationId: string; syncType: TaskSyncType; blockchainIds?: string[] }) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      params.address = params.address.toLowerCase()
      if (!params.blockchainIds) {
        params.blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
      }

      for (const blockchainId of params.blockchainIds) {
        await this.walletsService.updateChainStatusByAddress(
          {
            blockchainId: blockchainId,
            organizationId: params.organizationId,
            address: params.address
          },
          WalletStatusesEnum.SYNCING
        )

        const ingestionTaskId = await this.ingestionService.sync(params.address, blockchainId)

        const preprocessRawTask = await this.preprocessRawTasksService.getOrCreate({
          address: params.address,
          blockchainId: blockchainId,
          syncType: params.syncType,
          ingestionTaskId: ingestionTaskId ?? null
        })

        this.eventEmitter.emit(FinancialTransformationsEventType.PREPROCESS_RAW_SYNC_ADDRESS, preprocessRawTask.id)

        console.log(
          `preprocessRawTaskId ${preprocessRawTask.id} emitted -----------------------------------------------`
        )

        const coreTransformationTask = await this.coreTransformationTasksService.getOrCreate({
          address: params.address,
          blockchainId: blockchainId,
          organizationId: params.organizationId,
          syncType: params.syncType,
          preprocessRawTaskId: preprocessRawTask?.id
        })

        this.eventEmitter.emit(
          FinancialTransformationsEventType.CORE_TRANSFORMATION_SYNC_ADDRESS,
          coreTransformationTask.id
        )

        console.log(
          `coreTransformationTask ${coreTransformationTask.id} emitted -----------------------------------------------`
        )
      }
    }
  }

  async additionalSync(params: {
    address: string
    organizationId: string
    syncType: TaskSyncType
    blockchainId: string
  }) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      const wallet = await this.walletsService.getByOrganizationIdAndAddress(
        params.organizationId,
        params.address.toLowerCase(),
        { walletGroup: true }
      )

      if (wallet) {
        const perWalletTask = await this.additionalTransformationPerWalletTasksService.getOrCreate({
          walletId: wallet.id,
          address: params.address,
          blockchainId: params.blockchainId,
          organizationId: params.organizationId,
          syncType: params.syncType
        })

        this.eventEmitter.emit(
          FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET,
          perWalletTask.id
        )

        this.logger.log(
          `additionalTransformationPerWalletTask ${perWalletTask.id} is emitted. walletId: ${perWalletTask.walletId}, address: ${perWalletTask.address}`
        )

        await setTimeout(1000)

        const perWalletGroupTaskExist = await this.additionalTransformationPerWalletGroupTasksService.getTask({
          walletGroupId: wallet.walletGroup.id,
          blockchainId: params.blockchainId,
          organizationId: params.organizationId
        })

        if (!perWalletGroupTaskExist) {
          const perWalletGroupTask = await this.additionalTransformationPerWalletGroupTasksService.createTask({
            walletGroupId: wallet.walletGroup.id,
            blockchainId: params.blockchainId,
            organizationId: params.organizationId,
            syncType: params.syncType
          })

          this.eventEmitter.emit(
            FinancialTransformationsEventType.ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET_GROUP,
            perWalletGroupTask.id
          )

          this.logger.log(
            `additionalTransformationPerWalletGroupTask ${perWalletGroupTask.id} is emitted. walletGroupId: ${perWalletGroupTask.walletGroupId}`
          )
        }
      } else {
        this.logger.error(
          'FinancialTransformationsDomain additionalSync failed because address is not a wallet',
          params
        )
      }
    }
  }
}
