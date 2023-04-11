import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { BlockExplorerAdapterFactory } from '../../../../block-explorers/block-explorer.adapter.factory'
import { TaskStatusEnum } from '../../../../core/events/event-types'
import { IngestionEventType, IngestionSyncEvent } from '../../../../financial-transformations/events/events'
import { LoggerService } from '../../../logger/logger.service'
import { BlockExplorersProviderEnum } from '../../../types/block-explorers-provider.enum'
import { IngestionTask } from '../../ingestion-task/ingestion-task.entity'
import { IngestionTaskService } from '../../ingestion-task/ingestion-task.service'
import { RawTransactionService } from '../../raw-transactions/raw-transaction.service'

@Injectable()
export class IngestionsService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private ingestionTaskService: IngestionTaskService,
    private readonly blockExplorerAdapterFactory: BlockExplorerAdapterFactory,
    private readonly rawTransactionService: RawTransactionService,
    private logger: LoggerService
  ) {}

  async sync(address: string, blockchainId: string): Promise<string> {
    try {
      const fromBlock = await this.getLatestBlock({ address, blockchainId })
      this.logger.log(`Got latest block ${fromBlock} for address ${address} and blockchain ${blockchainId}`, {
        address,
        blockchainId,
        fromBlock
      })

      const ingestionTask = IngestionTask.create({
        blockchainId,
        address,
        fromBlock
      })

      const createdTask = await this.ingestionTaskService.getOrCreate(ingestionTask)
      this.logger.log(`Create or Get sync task for address ${address}`, { createdTask })

      if (createdTask.status === TaskStatusEnum.RUNNING) {
        // Skip if task is already in progress
        return
      }

      if (createdTask.status === TaskStatusEnum.FAILED && createdTask.error?.retryAt > new Date()) {
        // backoff timeout haven't passed yet
        return
      }

      this.eventEmitter.emit(IngestionEventType.INGESTION_SYNC_ADDRESS, new IngestionSyncEvent(createdTask.id))

      return createdTask.id
    } catch (e) {
      this.logger.error(`Can not create IngestionTask for address ${address}`, e, {
        address
      })
    }
  }

  async syncSourceOfFund(ingestionTaskId: string) {
    const ingestionTask = await this.ingestionTaskService.get(ingestionTaskId)
    if (!ingestionTask) {
      this.logger.error(`Can't find ingestion task with id ${ingestionTaskId}`)
      return
    }
    try {
      this.logger.log(`Start sync address ${ingestionTask.address}`, {
        ingestionTaskId: ingestionTask.id,
        meta: ingestionTask.metadata
      })
      await this.ingestionTaskService.changeStatus(ingestionTask.id, TaskStatusEnum.RUNNING)

      const adapter = this.blockExplorerAdapterFactory.getBlockExplorerAdapter(
        BlockExplorersProviderEnum.ALCHEMY,
        ingestionTask.blockchainId
      )

      const validatorFn = async (hash: string) => {
        const transaction = await this.rawTransactionService.getByAddressAndHash({
          address: ingestionTask.address,
          hash: hash,
          blockchainId: ingestionTask.blockchainId
        })
        return {
          loadInternal: !transaction?.internal,
          loadReceipt: !transaction?.receipt
        }
      }

      const rawTransactions = await adapter.getTransactionsByAddress(
        ingestionTask.address,
        {
          nextPageId: ingestionTask.metadata.nextPageId,
          direction: ingestionTask.metadata.direction,
          fromBlock: ingestionTask.metadata.fromBlock
        },
        validatorFn
      )

      this.logger.log(`Got ${rawTransactions.response.length} transactions for address ${ingestionTask.address}`, {
        ingestionTaskId: ingestionTask.id,
        metadata: ingestionTask.metadata,
        rawTransactions: {
          nextPageId: rawTransactions.nextPageId,
          order: rawTransactions.order,
          direction: rawTransactions.direction,
          lastBlock: rawTransactions.lastBlock,
          firstBlock: rawTransactions.firstBlock
        }
      })

      await this.rawTransactionService.saveOrUpdate(rawTransactions.response, ingestionTask)

      this.logger.log(`Saved ${rawTransactions.response.length} transactions for address ${ingestionTask.address}`, {
        ingestionTaskId: ingestionTask.id,
        metadata: ingestionTask.metadata,
        nextPageId: rawTransactions.nextPageId
      })

      if (rawTransactions.nextPageId) {
        await this.ingestionTaskService.updateMetadata(ingestionTask.id, {
          ...ingestionTask.metadata,
          nextPageId: rawTransactions.nextPageId
        })

        this.eventEmitter.emit(IngestionEventType.INGESTION_SYNC_ADDRESS, new IngestionSyncEvent(ingestionTask.id))

        //Updating all raw transactions earlier than before last block (to make sure that we will not miss any events from next page)
        //direction 'from' is important here, because direction 'to' goes first, and we have all entries from that.
        //So we need to update status for all entries only based on block number
        if (ingestionTask.metadata.direction === 'from') {
          this.logger.log(
            `Marking as completed all transactions earlier than ${rawTransactions.firstBlock} for address ${ingestionTask.address}`,
            {
              address: ingestionTask.address,
              blockchainId: ingestionTask.blockchainId,
              blockNumber: rawTransactions.firstBlock
            }
          )
          await this.rawTransactionService.markAsCompletedForNewerThanBlockNumber({
            address: ingestionTask.address,
            blockchainId: ingestionTask.blockchainId,
            blockNumber: rawTransactions.firstBlock
          })
        }
      } else if (ingestionTask.metadata.direction === 'to') {
        //TODO: that is temporal solution, need to be refactored. 'to' direction is default direction and here
        // we are switching to 'from' direction
        this.logger.log(`Switching direction to 'from' for address ${ingestionTask.address}`, {
          ingestionTaskId: ingestionTask.id,
          metadata: ingestionTask.metadata
        })
        const updatedMetadata = await this.ingestionTaskService.updateMetadata(ingestionTask.id, {
          ...ingestionTask.metadata,
          nextPageId: null,
          direction: 'from'
        })

        this.logger.log(`Switched direction to 'from' for address ${ingestionTask.address}`, {
          ingestionTaskId: ingestionTask.id,
          metadata: ingestionTask.metadata
        })
        this.eventEmitter.emit(IngestionEventType.INGESTION_SYNC_ADDRESS, new IngestionSyncEvent(ingestionTask.id))
        this.logger.log(`Emitted sync event for address ${ingestionTask.address}`, {
          ingestionTaskId: ingestionTask.id,
          metadata: updatedMetadata
        })
      } else {
        await this.ingestionTaskService.changeStatus(ingestionTask.id, TaskStatusEnum.COMPLETED)
        this.logger.log(
          `Marking as completed all transactions for sync task ${ingestionTask.id} for address ${ingestionTask.address}`,
          {
            address: ingestionTask.address,
            blockchainId: ingestionTask.blockchainId,
            blockNumber: rawTransactions.firstBlock
          }
        )
        await this.rawTransactionService.markAsCompletedByIngestionTaskId(ingestionTask.id)
      }
    } catch (e) {
      this.logger.error(`Can not sync address ${ingestionTask.address}`, e, { ingestionTask })
      // TODO: Properly catch this
      await this.rawTransactionService.markAsCompletedByIngestionTaskId(ingestionTask.id)
      await this.ingestionTaskService.handleError(ingestionTask, e?.stack)
    }
  }

  getLatestBlock(params: { address: string; blockchainId: string }): Promise<string | null> {
    return this.rawTransactionService.getLatestBlock({ address: params.address, blockchainId: params.blockchainId })
  }
}
