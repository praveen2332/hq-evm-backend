import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'

@Entity()
export class AdditionalTransformationPerWalletGroupTask extends BaseEntity {
  @Column({ name: 'wallet_group_id' })
  walletGroupId: string

  @Column({ name: 'organization_id' })
  organizationId: string

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({
    type: 'enum',
    enum: TaskStatusEnum
  })
  status: TaskStatusEnum = TaskStatusEnum.CREATED

  @Column({ name: 'sync_type', nullable: true })
  syncType: TaskSyncType

  @Column({ name: 'last_executed_at', nullable: true })
  lastExecutedAt: Date

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date

  @Column({ type: 'json', nullable: true })
  metadata: AdditionalTransformationPerWalletGroupTaskMetadata

  @Column({ type: 'json', nullable: true })
  error: any

  static create(params: {
    walletGroupId: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
    lastCompletedFinancialTransactionChildId: string | null
  }): AdditionalTransformationPerWalletGroupTask {
    const task = new AdditionalTransformationPerWalletGroupTask()
    task.walletGroupId = params.walletGroupId
    task.blockchainId = params.blockchainId
    task.organizationId = params.organizationId
    task.syncType = params.syncType
    task.metadata = {
      gainLossWorkflowStatus: null,
      lastCompletedFinancialTransactionChildId: params.lastCompletedFinancialTransactionChildId
    }

    return task
  }
}

export interface AdditionalTransformationPerWalletGroupTaskMetadata {
  gainLossWorkflowStatus: string
  lastCompletedFinancialTransactionChildId: string | null
}
