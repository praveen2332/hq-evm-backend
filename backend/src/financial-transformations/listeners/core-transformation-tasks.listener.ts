import { Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { setTimeout } from 'timers/promises'
import { dateHelper } from '../../common/helpers/date.helper'
import { LoggerService } from '../../common/logger/logger.service'
import { CoreTransformationTasksService } from '../../common/services/core-transformation-tasks/core-transformation-tasks.service'
import { FeatureFlagsService } from '../../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../../common/services/feature-flags/interfaces'
import { TaskStatusEnum } from '../../core/events/event-types'
import { CoreTransformationsDomainService } from '../core-transformations.domain.service'
import { FinancialTransformationsEventType } from '../events/events'
import { FinancialTransformationsDomainService } from '../financial-transformations.domain.service'

@Injectable()
export class CoreTransformationTasksListener {
  constructor(
    private eventEmitter: EventEmitter2,
    private coreTransformationTasksService: CoreTransformationTasksService,
    private coreTransformationsDomainService: CoreTransformationsDomainService,
    private financialTransformationsDomainService: FinancialTransformationsDomainService,
    private featureFlagsService: FeatureFlagsService,
    private logger: LoggerService
  ) {}

  @OnEvent(FinancialTransformationsEventType.CORE_TRANSFORMATION_SYNC_ADDRESS, { async: true, promisify: true })
  async handleCoreTransformationSyncAddressEvent(taskId: string) {
    if (await this.featureFlagsService.isFeatureEnabled(FeatureFlagOption.FINANCIAL_TRANSACTION)) {
      let task = await this.coreTransformationTasksService.get(taskId)

      const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
      this.logger.log(`coreTransformationTask ${taskId} is running for ${minutes} minutes and ${seconds} seconds`)

      try {
        if (task.status !== TaskStatusEnum.COMPLETED) {
          await this.coreTransformationTasksService.changeStatus(task.id, TaskStatusEnum.RUNNING)

          await this.coreTransformationsDomainService.executeWorkflow(task)

          task = await this.coreTransformationTasksService.get(taskId)
          if (task.status !== TaskStatusEnum.COMPLETED) {
            //Ingestion will take >10 seconds. So delay by 5 seconds.
            await setTimeout(5000)
            this.eventEmitter.emit(FinancialTransformationsEventType.CORE_TRANSFORMATION_SYNC_ADDRESS, task.id)
          } else {
            const { minutes, seconds } = dateHelper.getMinutesAndSecondsDifferenceFromTime(task.createdAt)
            this.logger.log(
              `coreTransformationTask ${taskId} is COMPLETED for ${minutes} minutes and ${seconds} seconds`
            )

            await this.financialTransformationsDomainService.additionalSync({
              address: task.address,
              organizationId: task.organizationId,
              syncType: task.syncType,
              blockchainId: task.blockchainId
            })
          }
        }
      } catch (e) {
        await this.coreTransformationTasksService.updateError(taskId, e)
        this.logger.error(`coreTransformationTask ${taskId} has errors`, e)
      }
    }
  }
}
