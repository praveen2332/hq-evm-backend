import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { AssetTransfersWithMetadataResult } from 'alchemy-sdk/dist/src/types/types'
import { FindOptionsWhere, ILike, MoreThan, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { LoggerService } from '../../logger/logger.service'
import { IngestionTask } from '../ingestion-task/ingestion-task.entity'
import { RawTransaction, RawTransactionStatusEnum } from './raw-transaction.entity'

@Injectable()
export class RawTransactionService extends BaseService<RawTransaction> {
  constructor(
    @InjectRepository(RawTransaction)
    private rawTransactionRepository: Repository<RawTransaction>,
    private readonly logger: LoggerService
  ) {
    super(rawTransactionRepository)
  }

  async saveOrUpdate(
    transactions: {
      hash: string
      receipt: TransactionReceipt
      blockNumber: string
      blockTimestamp: string
      transfers: AssetTransfersWithMetadataResult[]
      internal?: AssetTransfersWithMetadataResult[]
    }[],
    ingestionTask: IngestionTask
  ) {
    for (const transaction of transactions) {
      try {
        const rawTransaction = await this.getByAddressAndHash({
          address: ingestionTask.address,
          hash: transaction.hash,
          blockchainId: ingestionTask.blockchainId
        })
        if (rawTransaction) {
          if (rawTransaction.status === RawTransactionStatusEnum.COMPLETED) {
            // Skip if already completed. This can happen for every transaction from the last processing block.
            //A new query for the latest fromBlock include all the transactions processed previously for this block
            this.logger.log(`Transaction ${transaction.hash} already completed. Skipping...`)
            continue
          }

          let to: AssetTransfersWithMetadataResult[] = undefined
          let from: AssetTransfersWithMetadataResult[] = undefined

          if (ingestionTask.metadata.direction === 'to') {
            const missingTo = transaction.transfers.filter(
              (transfer) => !this.isTransferExists(rawTransaction.to, transfer)
            )
            to = [...(rawTransaction.to ?? []), ...missingTo]
          }

          if (ingestionTask.metadata.direction === 'from') {
            const missingFrom = transaction.transfers.filter(
              (transfer) => !this.isTransferExists(rawTransaction.from, transfer)
            )
            from = [...(rawTransaction.from ?? []), ...missingFrom]
          }

          await this.update({
            ...rawTransaction,
            receipt: rawTransaction.receipt ?? transaction.receipt ?? null,
            internal: rawTransaction.internal ?? transaction.internal ?? null,
            to: to as any,
            from: from as any
          })
        } else {
          const newRawTransaction = RawTransaction.create({
            hash: transaction.hash,
            address: ingestionTask.address,
            blockchainId: ingestionTask.blockchainId,
            receipt: transaction.receipt ?? null,
            to: ingestionTask.metadata.direction === 'to' ? transaction.transfers : null,
            from: ingestionTask.metadata.direction === 'from' ? transaction.transfers : null,
            internal: transaction.internal ?? null,
            ingestionTask: ingestionTask,
            blockNumber: transaction.blockNumber,
            blockTimestamp: transaction.blockTimestamp
          })
          await this.create(newRawTransaction)
        }
      } catch (e) {
        this.logger.error(
          `Could not save transaction ${transaction.hash} for address ${ingestionTask.address} on chain ${ingestionTask.blockchainId}`,
          e,
          {
            transaction,
            ingestionTask
          }
        )
        throw e
      }
    }
  }

  getByAddressAndHash(params: { address: string; hash: string; blockchainId: string }) {
    return this.rawTransactionRepository.findOne({
      where: {
        address: params.address,
        hash: params.hash,
        blockchainId: params.blockchainId
      }
    })
  }

  private isTransferExists(transfers: AssetTransfersWithMetadataResult[], transfer: AssetTransfersWithMetadataResult) {
    return transfers?.find((t) => t.uniqueId === transfer.uniqueId)
  }

  async getLatestBlock(params: { address: string; blockchainId: string }) {
    //find the latest fully synchronized entry for the address and chainId based on blockNumber
    const transaction = await this.rawTransactionRepository.findOne({
      where: {
        address: params.address,
        blockchainId: params.blockchainId,
        status: RawTransactionStatusEnum.COMPLETED
      },
      order: {
        blockNumberInt: 'DESC'
      }
    })

    return transaction?.blockNumber
  }

  async markAsCompletedForNewerThanBlockNumber(params: { address: string; blockchainId: string; blockNumber: string }) {
    await this.rawTransactionRepository.update(
      {
        address: ILike(params.address),
        blockchainId: params.blockchainId,
        blockNumber: MoreThan(params.blockNumber)
      },
      {
        status: RawTransactionStatusEnum.COMPLETED
      }
    )
  }

  async markAsCompletedByIngestionTaskId(ingestionTaskId: string) {
    await this.rawTransactionRepository.update(
      {
        ingestionTaskId: ingestionTaskId
      },
      {
        status: RawTransactionStatusEnum.COMPLETED
      }
    )
  }

  async getTransactionsByAddressAndBlockchainAndStatus(params: {
    address: string
    blockchainId: string
    status: RawTransactionStatusEnum
    startingId: string | null
  }): Promise<RawTransaction[]> {
    const findOptionsWhere: FindOptionsWhere<RawTransaction> = {
      address: ILike(params.address),
      status: params.status,
      blockchainId: params.blockchainId
    }

    if (params.startingId) {
      findOptionsWhere.id = MoreThan(params.startingId)
    }

    return await this.rawTransactionRepository.find({
      where: findOptionsWhere,
      order: {
        id: 'ASC'
      }
    })
  }
}
