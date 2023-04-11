import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { TaskStatusEnum, TaskSyncType } from '../../../core/events/event-types'

@Entity()
export class PreprocessRawTask extends BaseEntity {
  @Column()
  address: string

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
  metadata: PreprocessRawTaskMetadata

  @Column({ type: 'json', nullable: true })
  error: any

  static create(params: {
    address: string
    blockchainId: string
    syncType: TaskSyncType
    ingestionTaskId: string | null
    lastCompletedRawTransactionId: string | null
  }): PreprocessRawTask {
    const preprocessTask = new PreprocessRawTask()
    preprocessTask.address = params.address
    preprocessTask.blockchainId = params.blockchainId
    preprocessTask.syncType = params.syncType
    preprocessTask.metadata = {
      ingestionTaskId: params.ingestionTaskId ?? null,
      lastCompletedRawTransactionId: params.lastCompletedRawTransactionId ?? null
    }

    return preprocessTask
  }
}

export interface PreprocessRawTaskMetadata {
  ingestionTaskId: string | null
  lastCompletedRawTransactionId: string | null
}
