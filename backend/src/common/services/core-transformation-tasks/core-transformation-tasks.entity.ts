import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'

@Entity()
export class CoreTransformationTask extends BaseEntity {
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
  metadata: CoreTransformationTaskMetadata

  @Column({ type: 'json', nullable: true })
  error: any

  static create(params: {
    address: string
    blockchainId: string
    organizationId: string
    syncType: TaskSyncType
    preprocessRawTaskId: string | null
    lastCompletedFinancialTransactionPreprocessId: string | null
  }): CoreTransformationTask {
    const coreTransformationTask = new CoreTransformationTask()
    coreTransformationTask.address = params.address
    coreTransformationTask.blockchainId = params.blockchainId
    coreTransformationTask.organizationId = params.organizationId
    coreTransformationTask.syncType = params.syncType
    coreTransformationTask.metadata = {
      preprocessRawTaskId: params.preprocessRawTaskId ?? null,
      lastCompletedFinancialTransactionPreprocessId: params.lastCompletedFinancialTransactionPreprocessId ?? null
    }

    return coreTransformationTask
  }
}

export interface CoreTransformationTaskMetadata {
  preprocessRawTaskId: string | null
  lastCompletedFinancialTransactionPreprocessId: string | null
}
