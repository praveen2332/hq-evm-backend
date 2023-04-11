import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { LoggerService } from '../../common/logger/logger.service'
import { BlockchainsService } from '../../common/services/blockchains/blockchains.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { WalletStatusesEnum } from '../../common/services/wallets/interfaces'
import { WalletsService } from '../../common/services/wallets/wallets.service'
import { ChangeFiatCurrencyForOrganizationEventParams, FinancialTransformationsEventType } from '../events/events'
import { OperationalTransformationsDomainService } from '../operational-transformations.domain.service'
import { WalletsTransformationsDomainService } from '../wallets-transformations.domain.service'

@Injectable()
export class OperationalTransformationsListener {
  constructor(
    private operationalTransformationsDomainService: OperationalTransformationsDomainService,
    private featureFlagsService: FeatureFlagsService,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
    private blockchainsService: BlockchainsService,
    private walletsService: WalletsService,
    private walletsTransformationsDomainService: WalletsTransformationsDomainService
  ) {}

  // TODO: Enable for ignoring transaction later
  // @OnEvent(FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET, {
  //   async: true,
  //   promisify: true
  // })
  // async handleResyncGainLossForWalletEvent(params: ResyncGainLossForWalletEventParams) {
  //   if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
  //     this.logger.log(
  //       `OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET_GROUP is running for: ${JSON.stringify(
  //         params
  //       )}-------------------`
  //     )

  //     try {
  //       await this.additionalTransformationsDomainService.executeGainLossWorkflow(params)

  //       this.logger.log(
  //         `OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET_GROUP is COMPLETED for: ${JSON.stringify(
  //           params
  //         )}-------------------`
  //       )
  //     } catch (e) {
  //       this.logger.error(
  //         `Error handle OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET_GROUP for: ${JSON.stringify(params)}`,
  //         e
  //       )
  //     }
  //   }
  // }

  @OnEvent(FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD, {
    async: true,
    promisify: true
  })
  async handleResyncPriceForTransactionEvent(childId: string) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      this.logger.log(
        `OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD is running for: ${childId}-------------------`
      )

      try {
        await this.operationalTransformationsDomainService.executeResyncPriceForChildIdWorkflow(childId)

        this.logger.log(
          `OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD is COMPLETED for: ${childId}-------------------`
        )
      } catch (e) {
        this.logger.error(
          `Error handle OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD for: ${childId}`,
          e
        )
      }
    }
  }

  @OnEvent(FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION, {
    async: true,
    promisify: true
  })
  async handleResyncPriceForOrganizationEvent(params: ChangeFiatCurrencyForOrganizationEventParams) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      this.logger.log(
        `OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION is running for: ${params}-------------------`
      )

      try {
        await this.operationalTransformationsDomainService.executeChangeFiatCurrencyForOrganizationWorkflow(params)

        this.logger.log(
          `OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION is COMPLETED for: ${params}-------------------`
        )

        await this.walletsTransformationsDomainService.syncBalanceFromChainForOrganization(params.organizationId)
      } catch (e) {
        this.logger.error(
          `Error handle OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION for: ${params}`,
          e
        )
      } finally {
        await this.walletsTransformationsDomainService.maySetWalletsStatusForOrganization(
          params.organizationId,
          WalletStatusesEnum.SYNCED
        )
      }
    }
  }
}
