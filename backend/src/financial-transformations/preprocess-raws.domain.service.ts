import { Log } from '@ethersproject/abstract-provider'
import { Injectable } from '@nestjs/common'
import { AssetTransfersWithMetadataResult } from 'alchemy-sdk'
import Decimal from 'decimal.js'
import { BigNumber } from 'ethers'
import { hexToNumber, hexToNumberString, toBN } from 'web3-utils'
import { dateHelper } from '../common/helpers/date.helper'
import { LoggerService } from '../common/logger/logger.service'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import {
  CreateFinancialTransactionPreprocessDto,
  FinancialTransactionPreprocessSpecialAccount,
  FinancialTransactionPreprocessStatus
} from '../common/services/financial-transactions/interfaces'
import { IngestionTask } from '../common/services/ingestion-task/ingestion-task.entity'
import { IngestionTaskService } from '../common/services/ingestion-task/ingestion-task.service'
import { PreprocessRawTask } from '../common/services/preprocess-raw-tasks/preprocess-raw-task.entity'
import { PreprocessRawTasksService } from '../common/services/preprocess-raw-tasks/preprocess-raw-tasks.service'
import { RawTransaction, RawTransactionStatusEnum } from '../common/services/raw-transactions/raw-transaction.entity'
import { RawTransactionService } from '../common/services/raw-transactions/raw-transaction.service'
import { TaskStatusEnum } from '../core/events/event-types'

@Injectable()
export class PreprocessRawsDomainService {
  constructor(
    private preprocessRawTasksService: PreprocessRawTasksService,
    private ingestionTaskService: IngestionTaskService,
    private rawTransactionService: RawTransactionService,
    private financialTransactionsService: FinancialTransactionsEntityService,
    private cryptocurrenciesService: CryptocurrenciesService,
    private logger: LoggerService
  ) {}

  async executeWorkflow(task: PreprocessRawTask) {
    let ingestionTask: IngestionTask = null
    if (task.metadata.ingestionTaskId) {
      ingestionTask = await this.ingestionTaskService.get(task.metadata.ingestionTaskId)
    }

    if (
      !ingestionTask ||
      ingestionTask.status === TaskStatusEnum.COMPLETED ||
      (ingestionTask.status === TaskStatusEnum.FAILED && ingestionTask.blockchainId === SupportedBlockchains.GOERLI)
    ) {
      const rawTransactions = await this.rawTransactionService.getTransactionsByAddressAndBlockchainAndStatus({
        address: task.address,
        blockchainId: task.blockchainId,
        status: RawTransactionStatusEnum.COMPLETED,
        startingId: task.metadata.lastCompletedRawTransactionId
      })

      if (rawTransactions?.length > 0) {
        for (const rawTransaction of rawTransactions) {
          await this.createFinancialTransactionPreprocess(rawTransaction)
        }
        await this.preprocessRawTasksService.updateMetadata(task.id, {
          ...task.metadata,
          lastCompletedRawTransactionId: rawTransactions.at(-1).id
        })
      }
      await this.preprocessRawTasksService.changeStatus(task.id, TaskStatusEnum.COMPLETED)
    }
  }

  async createFinancialTransactionPreprocess(rawTransaction: RawTransaction) {
    let preprocessDtos: CreateFinancialTransactionPreprocessDto[] = []

    // Only when the status of the transaction in the chain is success
    if (rawTransaction.receipt.status === 1) {
      // Below might not work for multi chain
      const ethereumEntries: AssetTransfersWithMetadataResult[] = []
        .concat(rawTransaction.from, rawTransaction.to)
        .filter(
          (entry) => !!entry && entry.value !== 0 && (entry.category === 'external' || entry.category === 'internal')
        )

      const initiatorAddress = rawTransaction.receipt.from.toLowerCase()

      const ethList: CreateFinancialTransactionPreprocessDto[] = await this.preprocessEth(
        ethereumEntries,
        rawTransaction,
        initiatorAddress
      )
      const erc20List: CreateFinancialTransactionPreprocessDto[] = await this.preprocessErc20(
        rawTransaction,
        initiatorAddress
      )

      preprocessDtos = []
        .concat(ethList)
        .concat(erc20List)
        .filter((e) => e)
    }

    //At this point, only for gas calculation
    if (rawTransaction.receipt) {
      const feeChildDto = await this.preprocessGasFee(rawTransaction)
      preprocessDtos.push(feeChildDto)
    }

    const preprocessTransactions = []

    for (const dto of preprocessDtos) {
      if (dto) {
        preprocessTransactions.push(await this.financialTransactionsService.createPreprocess(dto))
      }
    }
  }

  async preprocessEth(
    ethereumEntries: AssetTransfersWithMetadataResult[],
    rawTransaction: RawTransaction,
    initiatorAddress: string
  ): Promise<CreateFinancialTransactionPreprocessDto[]> {
    const results: CreateFinancialTransactionPreprocessDto[] = []
    const blockchainId = rawTransaction.blockchainId

    const cryptocurrencyCoin = await this.cryptocurrenciesService.getCoinByBlockchain(blockchainId)

    for (const originalEntry of ethereumEntries) {
      if (originalEntry.asset === cryptocurrencyCoin.symbol && originalEntry.value > 0) {
        // Alchemy string value can be different from the hexadecimal value
        // https://etherscan.io/tx/0xf6fd7b40d9b097662631502d0ed8b293c563838a3c3d78b907a24674e066b1e7
        let amount = new Decimal(originalEntry.value)
        if (originalEntry.rawContract.value) {
          const decimal = Decimal.pow(10, hexToNumber(originalEntry.rawContract.decimal))
          amount = Decimal.div(hexToNumberString(originalEntry.rawContract.value), decimal)
        }

        const dto: CreateFinancialTransactionPreprocessDto = {
          forPublicIdGeneration: originalEntry.uniqueId,
          hash: rawTransaction.hash,
          blockchainId: rawTransaction.blockchainId,
          fromAddress: originalEntry.from.toLowerCase(),
          toAddress: originalEntry.to.toLowerCase(),
          initiatorAddress: initiatorAddress,
          cryptocurrency: cryptocurrencyCoin,
          cryptocurrencyAmount: amount.toString(),
          valueTimestamp: dateHelper.getUTCTimestampFrom(rawTransaction.blockTimestamp),
          status: FinancialTransactionPreprocessStatus.COMPLETED,
          rawTransactionId: rawTransaction.id
        }

        results.push(dto)
      }
    }

    if (rawTransaction.internal?.length) {
      for (const internalTxn of rawTransaction.internal) {
        // Alchemy string value can be different from the hexadecimal value
        // https://etherscan.io/tx/0xf6fd7b40d9b097662631502d0ed8b293c563838a3c3d78b907a24674e066b1e7
        let amount = new Decimal(internalTxn.value)
        if (internalTxn.rawContract.value) {
          const decimal = Decimal.pow(10, hexToNumber(internalTxn.rawContract.decimal))
          amount = Decimal.div(hexToNumberString(internalTxn.rawContract.value), decimal)
        }
        const dto: CreateFinancialTransactionPreprocessDto = {
          forPublicIdGeneration: internalTxn.uniqueId,
          hash: rawTransaction.hash,
          blockchainId: rawTransaction.blockchainId,
          fromAddress: internalTxn.from.toLowerCase(),
          toAddress: internalTxn.to.toLowerCase(),
          initiatorAddress: initiatorAddress,
          cryptocurrency: cryptocurrencyCoin,
          cryptocurrencyAmount: amount.toString(),
          valueTimestamp: dateHelper.getUTCTimestampFrom(new Date(rawTransaction.blockTimestamp)),
          status: FinancialTransactionPreprocessStatus.COMPLETED,
          rawTransactionId: rawTransaction.id
        }
        results.push(dto)
      }
    }
    return results
  }

  async preprocessErc20(
    rawTransaction: RawTransaction,
    initiatorAddress: string
  ): Promise<CreateFinancialTransactionPreprocessDto[]> {
    const results: CreateFinancialTransactionPreprocessDto[] = []
    const blockchainId = rawTransaction.blockchainId

    const logs: Array<Log> = rawTransaction.receipt?.logs

    if (!logs) {
      return []
    }

    const erc20TransferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    const alchemyLogsPadding = '000000000000000000000000'

    const filteredLogs = logs
      .filter((log) => log.topics?.at(0)?.toLowerCase() === erc20TransferSignature.toLowerCase())
      .sort((a, b) => a.logIndex - b.logIndex)

    for (const log of filteredLogs) {
      let cryptocurrency = await this.cryptocurrenciesService.getByAddressAndBlockchain(log.address, blockchainId)

      if (!cryptocurrency) {
        try {
          cryptocurrency = await this.cryptocurrenciesService.createNewErc20Token(log.address, blockchainId)

          if (!cryptocurrency) {
            continue
          }
        } catch (e) {
          this.logger.error('Error in creating token', log.address, e)
          continue
        }
      }

      const decimal = Math.pow(
        10,
        this.cryptocurrenciesService.getDecimalForCryptocurrency(cryptocurrency, rawTransaction.blockchainId)
      )

      let from = log.topics.at(1).replace(alchemyLogsPadding, '').toLowerCase()
      const to = log.topics.at(2).replace(alchemyLogsPadding, '').toLowerCase()

      const amount = Decimal.div(toBN(log.data).toString(), decimal)

      if (amount.equals(0)) {
        continue
      }

      const dto: CreateFinancialTransactionPreprocessDto = {
        forPublicIdGeneration: log.transactionHash + log.logIndex,
        hash: rawTransaction.hash,
        blockchainId: rawTransaction.blockchainId,
        fromAddress: from,
        toAddress: to,
        initiatorAddress: initiatorAddress,
        cryptocurrency: cryptocurrency,
        cryptocurrencyAmount: amount.toString(),
        valueTimestamp: dateHelper.getUTCTimestampFrom(rawTransaction.blockTimestamp),
        status: FinancialTransactionPreprocessStatus.COMPLETED,
        rawTransactionId: rawTransaction.id
      }

      results.push(dto)
    }

    return results
  }

  async preprocessGasFee(rawTransaction: RawTransaction): Promise<CreateFinancialTransactionPreprocessDto> {
    const from = rawTransaction.receipt.from.toLowerCase()
    const to = FinancialTransactionPreprocessSpecialAccount.GAS_FEE_ACCOUNT

    const cryptocurrency = await this.cryptocurrenciesService.getCoinByBlockchain(rawTransaction.blockchainId)

    if (!cryptocurrency) {
      this.logger.error(`No coin detected for chain id ${rawTransaction.blockchainId}`)
    }

    const decimal = Math.pow(
      10,
      this.cryptocurrenciesService.getDecimalForCryptocurrency(cryptocurrency, rawTransaction.blockchainId)
    )

    const gasUsed = new Decimal(BigNumber.from(rawTransaction.receipt.gasUsed).toNumber())
    const effectiveGasPrice = new Decimal(BigNumber.from(rawTransaction.receipt.effectiveGasPrice).toNumber())

    const cryptocurrencyAmount = gasUsed.mul(effectiveGasPrice).div(decimal)

    const dto: CreateFinancialTransactionPreprocessDto = {
      forPublicIdGeneration: rawTransaction.hash + 'gas',
      hash: rawTransaction.hash,
      blockchainId: rawTransaction.blockchainId,
      fromAddress: from,
      toAddress: to,
      initiatorAddress: from,
      cryptocurrency: cryptocurrency,
      cryptocurrencyAmount: cryptocurrencyAmount.toString(),
      valueTimestamp: dateHelper.getUTCTimestampFrom(rawTransaction.blockTimestamp),
      status: FinancialTransactionPreprocessStatus.COMPLETED,
      rawTransactionId: rawTransaction.id
    }

    return dto
  }
}
