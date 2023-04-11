import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { AssetTransfersWithMetadataResult } from 'alchemy-sdk/dist/src/types/types'
import { Column, Entity, Index } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { IngestionTask } from '../ingestion-task/ingestion-task.entity'
import { hexToNumber } from 'web3-utils'

export enum RawTransactionStatusEnum {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED'
}

@Entity()
@Index('UQ_raw_transaction_hash_blockchainId_address', ['hash', 'blockchainId', 'address'], { unique: true })
export class RawTransaction extends BaseEntity {
  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column()
  hash: string

  @Column()
  address: string

  @Column({ name: 'block_number' })
  blockNumber: string

  @Column({ name: 'block_number_int' })
  blockNumberInt: number

  @Column({ name: 'block_timestamp' })
  blockTimestamp: string

  @Column({ name: 'ingestion_task_id' })
  ingestionTaskId: string

  @Column({ type: 'json', nullable: true })
  receipt: TransactionReceipt

  @Column({ type: 'json', nullable: true })
  to: AssetTransfersWithMetadataResult[]

  @Column({ type: 'json', nullable: true })
  from: AssetTransfersWithMetadataResult[]

  @Column({ type: 'json', nullable: true })
  internal: AssetTransfersWithMetadataResult[]

  @Column({
    type: 'enum',
    enum: RawTransactionStatusEnum,
    default: RawTransactionStatusEnum.RUNNING
  })
  status: RawTransactionStatusEnum = RawTransactionStatusEnum.RUNNING

  static create(params: {
    hash: string
    address: string
    blockchainId: string
    receipt?: any
    to?: any[]
    from?: any[]
    internal?: any[]
    ingestionTask: IngestionTask
    blockNumber: string
    blockTimestamp: string
  }): RawTransaction {
    const rawTransaction = new RawTransaction()
    rawTransaction.address = params.address
    rawTransaction.hash = params.hash
    rawTransaction.blockchainId = params.blockchainId
    rawTransaction.ingestionTaskId = params.ingestionTask.id
    rawTransaction.receipt = params.receipt ?? null
    rawTransaction.to = params.to ?? null
    rawTransaction.from = params.from ?? null
    rawTransaction.internal = params.internal ?? null
    rawTransaction.blockNumber = params.blockNumber
    rawTransaction.blockNumberInt = hexToNumber(params.blockNumber)
    rawTransaction.blockTimestamp = params.blockTimestamp
    return rawTransaction
  }
}
