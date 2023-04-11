import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'
import { dateHelper } from '../../helpers/date.helper'
import {
  AdditionalTransformationPerWalletTask,
  AdditionalTransformationPerWalletTaskMetadata
} from './additional-transformation-per-wallet-task.entity'

@Injectable()
export class AdditionalTransformationPerWalletTasksService extends BaseService<AdditionalTransformationPerWalletTask> {
  constructor(
    @InjectRepository(AdditionalTransformationPerWalletTask)
    private additionalTransformationPerWalletTaskRepository: Repository<AdditionalTransformationPerWalletTask>
  ) {
    super(additionalTransformationPerWalletTaskRepository)
  }

  getCurrentTaskByWalletAndBlockchainAndOrganization(params: {
    walletId: string
    blockchainId: string
    organizationId: string
  }) {
    return this.findOne({
      where: {
        walletId: params.walletId,
        blockchainId: params.blockchainId,
        organizationId: params.organizationId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })
  }

  async getOrCreate(params: {
    walletId: string
    address: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
  }) {
    const task = await this.findOne({
      where: {
        walletId: params.walletId,
        blockchainId: params.blockchainId,
        organizationId: params.organizationId,
        status: In([TaskStatusEnum.CREATED, TaskStatusEnum.RUNNING, TaskStatusEnum.FAILED])
      }
    })

    if (task) {
      return task
    }

    const additionalTransformationPerWalletTask = AdditionalTransformationPerWalletTask.create({
      walletId: params.walletId,
      address: params.address,
      blockchainId: params.blockchainId,
      organizationId: params.organizationId,
      syncType: params.syncType
    })

    return this.create(additionalTransformationPerWalletTask)
  }

  async updateMetadata(id: string, metadata: AdditionalTransformationPerWalletTaskMetadata) {
    return this.additionalTransformationPerWalletTaskRepository.update(id, { metadata })
  }

  async changeStatus(id: string, status: TaskStatusEnum, error?: any) {
    const tempDate = dateHelper.getUTCTimestamp()
    const updateData: Partial<AdditionalTransformationPerWalletTask> = {
      status,
      error: error ?? null,
      lastExecutedAt: status === TaskStatusEnum.RUNNING ? tempDate : undefined,
      completedAt: status === TaskStatusEnum.COMPLETED ? tempDate : undefined
    }
    return this.additionalTransformationPerWalletTaskRepository.update(id, updateData)
  }

  async updateError(taskId: string, e: any) {
    return this.additionalTransformationPerWalletTaskRepository.update(taskId, { error: e })
  }
}
