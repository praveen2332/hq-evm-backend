import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'
import { Direction } from '../../../core/interfaces'
import { CoreTransformationTask, CoreTransformationTaskMetadata } from './core-transformation-tasks.entity'

@Injectable()
export class CoreTransformationTasksService extends BaseService<CoreTransformationTask> {
  constructor(
    @InjectRepository(CoreTransformationTask)
    private coreTransformationTaskRepository: Repository<CoreTransformationTask>
  ) {
    super(coreTransformationTaskRepository)
  }

  async getOrCreate(params: {
    address: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
    preprocessRawTaskId?: string | null
  }) {
    const task = await this.findOne({
      where: {
        address: params.address,
        blockchainId: params.blockchainId,
        organizationId: params.organizationId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })

    if (task) {
      return task
    }

    let lastCompletedFinancialTransactionPreprocessId = null

    if (params.syncType === TaskSyncType.INCREMENTAL) {
      const lastCompletedtask = await this.findOne({
        where: {
          address: params.address,
          blockchainId: params.blockchainId,
          organizationId: params.organizationId,
          status: TaskStatusEnum.COMPLETED
        },
        order: { id: Direction.DESC }
      })
      lastCompletedFinancialTransactionPreprocessId =
        lastCompletedtask?.metadata?.lastCompletedFinancialTransactionPreprocessId
    }

    const coreTransformationTask = CoreTransformationTask.create({
      address: params.address,
      blockchainId: params.blockchainId,
      organizationId: params.organizationId,
      syncType: params.syncType,
      preprocessRawTaskId: params.preprocessRawTaskId,
      lastCompletedFinancialTransactionPreprocessId
    })

    return this.create(coreTransformationTask)
  }

  getCurrentTaskByAddressAndBlockchainAndOrganization(params: {
    address: string
    blockchainId: string
    organizationId: string
  }) {
    return this.findOne({
      where: {
        address: params.address,
        blockchainId: params.blockchainId,
        organizationId: params.organizationId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })
  }

  async updateMetadata(id: string, metadata: CoreTransformationTaskMetadata) {
    return this.coreTransformationTaskRepository.update(id, { metadata })
  }

  async changeStatus(id: string, status: TaskStatusEnum, error?: any) {
    const updateData: Partial<CoreTransformationTask> = {
      status,
      error: error ?? null,
      lastExecutedAt: status === TaskStatusEnum.RUNNING ? new Date() : undefined,
      completedAt: status === TaskStatusEnum.COMPLETED ? new Date() : undefined
    }
    return this.coreTransformationTaskRepository.update(id, updateData)
  }

  async updateError(taskId: string, e: any) {
    return this.coreTransformationTaskRepository.update(taskId, { error: e.stack })
  }
}
