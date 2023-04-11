import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, LessThanOrEqual, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { TaskStatusEnum } from '../../../core/events/event-types'
import { MAX_RETRIES, ONE_HOUR_IN_MS } from '../../constants'
import { IngestionTask, IngestionTaskMetadata } from './ingestion-task.entity'

@Injectable()
export class IngestionTaskService extends BaseService<IngestionTask> {
  constructor(
    @InjectRepository(IngestionTask)
    private ingestionTaskRepository: Repository<IngestionTask>
  ) {
    super(ingestionTaskRepository)
  }

  async getOrCreate(ingestionTask: IngestionTask) {
    const task = await this.findOne({
      where: {
        blockchainId: ingestionTask.blockchainId,
        address: ingestionTask.address,
        status: In([TaskStatusEnum.RUNNING, TaskStatusEnum.CREATED, TaskStatusEnum.FAILED])
      }
    })

    if (task) {
      return task
    }

    return this.create(ingestionTask)
  }

  async updateMetadata(id: string, meta: IngestionTaskMetadata): Promise<Partial<IngestionTask>> {
    await this.ingestionTaskRepository.update(id, { metadata: meta })
    return {
      metadata: meta
    }
  }

  async changeStatus(
    id: string,
    status: TaskStatusEnum,
    error?: { message: any; retryAt: Date; retryCount: number }
  ): Promise<Partial<IngestionTask>> {
    const updateData: Partial<IngestionTask> = {
      status,
      error: error ?? null,
      lastExecutionAt: status === TaskStatusEnum.RUNNING ? new Date() : undefined,
      completedAt: status === TaskStatusEnum.COMPLETED ? new Date() : undefined
    }
    await this.ingestionTaskRepository.update(id, updateData)
    return updateData
  }

  async handleError(ingestionTask: IngestionTask, error: any) {
    if (ingestionTask.error?.retryCount >= MAX_RETRIES) {
      return this.changeStatus(ingestionTask.id, TaskStatusEnum.TERMINATED, {
        message: error,
        retryAt: null,
        retryCount: (ingestionTask.error?.retryCount ?? 0) + 1
      })
    } else {
      const backOffSeconds = 2 ** (ingestionTask.error?.retryCount ?? 0) * 1000 * 10
      console.log(`Backoff for ${ingestionTask.id} is ${backOffSeconds}ms`, {
        newDate: new Date(),
        next: new Date(Date.now() + backOffSeconds)
      })

      return this.changeStatus(ingestionTask.id, TaskStatusEnum.FAILED, {
        message: error,
        retryAt: new Date(Date.now() + backOffSeconds),
        retryCount: (ingestionTask.error?.retryCount ?? 0) + 1
      })
    }
  }

  async getFailedIngestionTasks() {
    return this.find({
      where: [
        {
          status: TaskStatusEnum.FAILED
        },
        {
          status: TaskStatusEnum.RUNNING,
          lastExecutionAt: LessThanOrEqual(new Date(Date.now() - ONE_HOUR_IN_MS))
        }
      ]
    })
  }
}
