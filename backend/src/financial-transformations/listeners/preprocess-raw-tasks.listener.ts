import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { setTimeout } from 'timers/promises'
import { dateHelper } from '../../common/helpers/date.helper'
import { LoggerService } from '../../common/logger/logger.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { PreprocessRawTasksService } from '../../common/services/preprocess-raw-tasks/preprocess-raw-tasks.service'
import { TaskStatusEnum } from '../../core/events/event-types'
import { FinancialTransformationsEventType } from '../events/events'
import { PreprocessRawsDomainService } from '../preprocess-raws.domain.service'

@Injectable()
export class PreprocessRawTasksListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private preprocessRawTasksService: PreprocessRawTasksService,
    private preprocessRawsDomainService: PreprocessRawsDomainService,
    private featureFlagsService: FeatureFlagsService,
    private logger: LoggerService
  ) {}

  @OnEvent(FinancialTransformationsEventType.PREPROCESS_RAW_SYNC_ADDRESS, { async: true, promisify: true })
  async handlePreprocessRawSyncAddressEvent(taskId: string) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      let task = await this.preprocessRawTasksService.get(taskId)

      const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
      this.logger.log(`preprocessRawTask ${taskId} is running for ${minutes} minutes and ${seconds} seconds`)

      try {
        if (task.status !== TaskStatusEnum.COMPLETED) {
          await this.preprocessRawTasksService.changeStatus(task.id, TaskStatusEnum.RUNNING)

          await this.preprocessRawsDomainService.executeWorkflow(task)

          task = await this.preprocessRawTasksService.get(taskId)
          if (task.status !== TaskStatusEnum.COMPLETED) {
            //Retry here. Ingestion will take >10 seconds. So delay by 4 seconds.
            await setTimeout(4000)
            this.eventEmitter.emit(FinancialTransformationsEventType.PREPROCESS_RAW_SYNC_ADDRESS, task.id)
          } else {
            const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
            this.logger.log(`preprocessRawTask ${taskId} is COMPLETED after ${minutes} minutes and ${seconds} seconds`)
          }
        }
      } catch (e) {
        await this.preprocessRawTasksService.updateError(taskId, e)
        this.logger.error(`preprocessRawTask ${taskId} has errors`, e)
      }
    }
  }
}
