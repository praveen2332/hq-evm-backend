import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron } from '@nestjs/schedule'
import { setTimeout } from 'timers/promises'
import { LoggerService } from '../common/logger/logger.service'
import { IngestionTaskService } from '../common/services/ingestion-task/ingestion-task.service'
import { IngestionEventType, IngestionSyncEvent } from '../financial-transformations/events/events'

@Injectable()
export class TransformationScheduler {
  constructor(
    private logger: LoggerService,
    private eventEmitter: EventEmitter2,
    private ingestionTaskService: IngestionTaskService
  ) {}

  @Cron('*/1 * * * *', { utcOffset: 0 })
  async retryFailedIngestionTasks() {
    this.logger.log('Initiate job for retry failed ingestion tasks starts...', new Date().toString())

    const failedIngestionTasks = await this.ingestionTaskService.getFailedIngestionTasks()
    this.logger.log('Amounts of failed ingestion tasks: ', failedIngestionTasks.length)

    for (const failedIngestionTask of failedIngestionTasks) {
      this.eventEmitter.emit(IngestionEventType.INGESTION_SYNC_ADDRESS, new IngestionSyncEvent(failedIngestionTask.id))
      //That is a temporary solution to avoid the rate limit of the API and prevent concurrency issues with creation sync tasks for the same address
      //TODO: Can be removed later, after the implementation of locking mechanism for the sync tasks
      await setTimeout(10000)
    }
  }
}
