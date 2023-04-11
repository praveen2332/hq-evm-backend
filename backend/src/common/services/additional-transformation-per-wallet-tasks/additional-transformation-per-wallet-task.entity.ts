import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'

@Entity()
export class AdditionalTransformationPerWalletTask extends BaseEntity {
  @Column({ name: 'wallet_id' })
  walletId: string

  @Column()
  address: string

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
  metadata: AdditionalTransformationPerWalletTaskMetadata

  @Column({ type: 'json', nullable: true })
  error: any

  static create(params: {
    walletId: string
    address: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
  }): AdditionalTransformationPerWalletTask {
    const task = new AdditionalTransformationPerWalletTask()
    task.walletId = params.walletId
    task.address = params.address.toLowerCase()
    task.blockchainId = params.blockchainId
    task.organizationId = params.organizationId
    task.syncType = params.syncType
    task.metadata = {
      fillMissingFiatPriceWorkflowStatus: null,
      gnosisWorkflowStatus: null
    }

    return task
  }
}

export interface AdditionalTransformationPerWalletTaskMetadata {
  fillMissingFiatPriceWorkflowStatus: string
  gnosisWorkflowStatus: string
}
