import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { LoggerService } from '../../common/logger/logger.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { WalletEventTypesEnum } from '../events/event-types'
import { WalletBalanceSyncForOrganizationEventParams, WalletBalanceSyncPerWalletEventParams } from '../events/events'
import { WalletsDomainService } from '../wallets.domain.service'
import { WalletsTransformationsDomainService } from '../../financial-transformations/wallets-transformations.domain.service'

@Injectable()
export class WalletsListener {
  constructor(
    private logger: LoggerService,
    private walletsDomainService: WalletsDomainService,
    private featureFlagsService: FeatureFlagsService,
    private walletsTransformationsDomainService: WalletsTransformationsDomainService
  ) {}

  @OnEvent(WalletEventTypesEnum.WALLET_SYNC_BALANCE_PER_WALLET, { async: true, promisify: true })
  async handleSyncBalancePerWalletEvent(event: WalletBalanceSyncPerWalletEventParams) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      try {
        this.logger.log(`WALLET_SYNC_BALANCE_PER_WALLET is running for wallet ${event?.walletId}`, { event })
        // await this.walletsTransformationsDomainService.syncBalance(event.walletId)
        await this.walletsTransformationsDomainService.syncBalanceFromChain(event.walletId)
      } catch (e) {
        this.logger.error(`WALLET_SYNC_BALANCE_PER_WALLET failed for wallet ${event?.walletId}: ${e.message}`, e, {
          event
        })
      }
    }
  }

  @OnEvent(WalletEventTypesEnum.WALLET_SYNC_BALANCE_FOR_ORGANIZATION, { async: true, promisify: true })
  async handleSyncBalanceForOrganizationEvent(event: WalletBalanceSyncForOrganizationEventParams) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      try {
        this.logger.log(
          `WALLET_SYNC_BALANCE_FOR_ORGANIZATION is running for organizationId: ${event?.organizationId}`,
          { event }
        )
        await this.walletsTransformationsDomainService.syncBalanceFromChainForOrganization(event.organizationId)
      } catch (e) {
        this.logger.error(
          `WALLET_SYNC_BALANCE_FOR_ORGANIZATION failed for organizationId: ${event?.organizationId}: ${e.message}`,
          e,
          {
            event
          }
        )
      }
    }
  }

  // @OnEvent(EventTypesEnum.WALLET_SYNC_CHANGE_STATUS, { async: true, promisify: true })
  // async handleWalletChangeStatus(event: WalletChangeSyncStatusEvent) {
  //   try {
  //     this.logger.log(
  //       `Sync wallet balance for wallet address ${event?.payload.address} and organization ${event.payload.address}`,
  //       { event: event.payload }
  //     )
  //     await this.walletDomainService.changeStatus(event.payload)
  //   } catch (e) {
  //     this.logger.error(
  //       `Can't update wallet sync status ${event?.payload.address} and organization ${event.payload.address}: ${e.message}`,
  //       e,
  //       {
  //         event
  //       }
  //     )
  //   }
  // }
}
