import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { LoggerService } from '../../common/logger/logger.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { IngestionsService } from '../../common/services/general/ingestion/ingestions.service'
import { IngestionEventType, IngestionSyncEvent } from '../events/events'

@Injectable()
export class IngestionTasksListener {
  constructor(
    private readonly ingestionsService: IngestionsService,
    private logger: LoggerService,
    private featureFlagsService: FeatureFlagsService
  ) {}

  @OnEvent(IngestionEventType.INGESTION_SYNC_ADDRESS, { async: true, promisify: true })
  async handleIngestionSyncAddressEvent(event: IngestionSyncEvent) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      try {
        this.logger.log(`Sync wallet transactions for ingestionTask ${event?.ingestionTaskId}`, { event })
        await this.ingestionsService.syncSourceOfFund(event.ingestionTaskId)
      } catch (e) {
        this.logger.error(`Can't sync source of fund for ingestionTask ${event?.ingestionTaskId}: ${e.message}`, e, {
          event
        })
      }
    }
  }
}
