import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { TaskStatusEnum } from '../../../core/events/event-types'
import { BlockExplorersProviderEnum } from '../../types/block-explorers-provider.enum'

@Entity()
export class IngestionTask extends BaseEntity {
  @Column()
  address: string

  @Column({
    type: 'enum',
    enum: TaskStatusEnum,
    default: TaskStatusEnum.CREATED
  })
  status: TaskStatusEnum = TaskStatusEnum.CREATED

  @Column({ name: 'amount_processed' })
  amountProcessed: number = 0

  @Column({ name: 'last_execution_at', nullable: true })
  lastExecutionAt: Date

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({ type: 'json', nullable: true })
  metadata: IngestionTaskMetadata

  @Column({ type: 'json', nullable: true })
  error: {
    message: any
    retryAt: Date
    retryCount: number
  }

  constructor() {
    super()
    this.metadata = {
      provider: BlockExplorersProviderEnum.ALCHEMY,
      nextPageId: null,
      direction: 'to',
      fromBlock: null
    }
  }

  static create(params: { blockchainId: string; address: string; fromBlock: string }): IngestionTask {
    const ingestionTask = new IngestionTask()
    ingestionTask.blockchainId = params.blockchainId
    ingestionTask.address = params.address
    ingestionTask.metadata.fromBlock = params.fromBlock
    return ingestionTask
  }
}

export interface IngestionTaskMetadata {
  provider: BlockExplorersProviderEnum
  nextPageId: string
  direction: 'to' | 'from'
  fromBlock: string | null
}
