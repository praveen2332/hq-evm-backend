import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'
import { Direction } from '../../../core/interfaces'
import { dateHelper } from '../../helpers/date.helper'
import {
  AdditionalTransformationPerWalletGroupTask,
  AdditionalTransformationPerWalletGroupTaskMetadata
} from './additional-transformation-per-wallet-group-task.entity'

@Injectable()
export class AdditionalTransformationPerWalletGroupTasksService extends BaseService<AdditionalTransformationPerWalletGroupTask> {
  constructor(
    @InjectRepository(AdditionalTransformationPerWalletGroupTask)
    private additionalTransformationPerWalletGroupTaskRepository: Repository<AdditionalTransformationPerWalletGroupTask>
  ) {
    super(additionalTransformationPerWalletGroupTaskRepository)
  }

  getTask(params: { walletGroupId: string; blockchainId: string; organizationId: string }) {
    return this.findOne({
      where: {
        walletGroupId: params.walletGroupId,
        blockchainId: params.blockchainId,
        organizationId: params.organizationId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })
  }

  async createTask(params: {
    walletGroupId: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
  }) {
    let lastCompletedFinancialTransactionChildId = null

    if (params.syncType === TaskSyncType.INCREMENTAL) {
      const lastCompletedtask = await this.findOne({
        where: {
          walletGroupId: params.walletGroupId,
          blockchainId: params.blockchainId,
          organizationId: params.organizationId,
          status: TaskStatusEnum.COMPLETED
        },
        order: { id: Direction.DESC }
      })

      lastCompletedFinancialTransactionChildId = lastCompletedtask?.metadata?.lastCompletedFinancialTransactionChildId
    }

    const additionalTransformationPerWalletGroupTask = AdditionalTransformationPerWalletGroupTask.create({
      walletGroupId: params.walletGroupId,
      blockchainId: params.blockchainId,
      organizationId: params.organizationId,
      syncType: params.syncType,
      lastCompletedFinancialTransactionChildId
    })

    return this.create(additionalTransformationPerWalletGroupTask)
  }

  async updateMetadata(id: string, metadata: AdditionalTransformationPerWalletGroupTaskMetadata) {
    return this.additionalTransformationPerWalletGroupTaskRepository.update(id, { metadata })
  }

  async changeStatus(id: string, status: TaskStatusEnum, error?: any) {
    const tempDate = dateHelper.getUTCTimestamp()
    const updateData: Partial<AdditionalTransformationPerWalletGroupTask> = {
      status,
      error: error ?? null,
      lastExecutedAt: status === TaskStatusEnum.RUNNING ? tempDate : undefined,
      completedAt: status === TaskStatusEnum.COMPLETED ? tempDate : undefined
    }
    return this.additionalTransformationPerWalletGroupTaskRepository.update(id, updateData)
  }

  async updateError(taskId: string, e: any) {
    return this.additionalTransformationPerWalletGroupTaskRepository.update(taskId, { error: e })
  }
}
