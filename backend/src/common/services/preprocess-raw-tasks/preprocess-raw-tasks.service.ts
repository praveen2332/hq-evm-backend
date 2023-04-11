import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'
import { Direction } from '../../../core/interfaces'
import { PreprocessRawTask, PreprocessRawTaskMetadata } from './preprocess-raw-task.entity'

@Injectable()
export class PreprocessRawTasksService extends BaseService<PreprocessRawTask> {
  constructor(
    @InjectRepository(PreprocessRawTask)
    private preprocessRawTaskRepository: Repository<PreprocessRawTask>
  ) {
    super(preprocessRawTaskRepository)
  }

  //TODO: Implement the startingBlockNumber correctly. Whether check the wallet or last transaction
  async getOrCreate(params: {
    address: string
    blockchainId: string
    syncType: TaskSyncType
    ingestionTaskId: string | null
  }) {
    const task = await this.findOne({
      where: {
        address: params.address,
        blockchainId: params.blockchainId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })

    if (task) {
      return task
    }

    let lastCompletedRawTransactionId = null

    if (params.syncType === TaskSyncType.INCREMENTAL) {
      const lastCompletedtask = await this.findOne({
        where: {
          address: params.address,
          blockchainId: params.blockchainId,
          status: TaskStatusEnum.COMPLETED
        },
        order: { id: Direction.DESC }
      })
      lastCompletedRawTransactionId = lastCompletedtask?.metadata?.lastCompletedRawTransactionId
    }

    const preprocessRawTask = PreprocessRawTask.create({
      address: params.address,
      blockchainId: params.blockchainId,
      syncType: params.syncType,
      ingestionTaskId: params.ingestionTaskId,
      lastCompletedRawTransactionId
    })

    return this.create(preprocessRawTask)
  }

  async updateMetadata(id: string, metadata: PreprocessRawTaskMetadata) {
    return this.preprocessRawTaskRepository.update(id, { metadata })
  }

  async changeStatus(id: string, status: TaskStatusEnum, error?: any) {
    const updateData: Partial<PreprocessRawTask> = {
      status,
      error: error ?? null,
      lastExecutedAt: status === TaskStatusEnum.RUNNING ? new Date() : undefined,
      completedAt: status === TaskStatusEnum.COMPLETED ? new Date() : undefined
    }
    return this.preprocessRawTaskRepository.update(id, updateData)
  }

  async updateError(taskId: string, e: any) {
    return this.preprocessRawTaskRepository.update(taskId, { error: e })
  }
}
