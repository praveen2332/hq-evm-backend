import { Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { LoggerService } from '../common/logger/logger.service'
import { CoreTransformationTask } from '../common/services/core-transformation-tasks/core-transformation-tasks.entity'
import { CoreTransformationTasksService } from '../common/services/core-transformation-tasks/core-transformation-tasks.service'
import { FinancialTransactionPreprocess } from '../common/services/financial-transactions/financial-transaction-preprocess.entity'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import {
  CreateFinancialTransactionChildDto,
  CreateFinancialTransactionParentDto,
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataType,
  FinancialTransactionParentStatus,
  FinancialTransactionPreprocessSpecialAccount,
  FinancialTransactionPreprocessStatus,
  GainLossInclusionStatus
} from '../common/services/financial-transactions/interfaces'
import { PreprocessRawTasksService } from '../common/services/preprocess-raw-tasks/preprocess-raw-tasks.service'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { TaskStatusEnum } from '../core/events/event-types'

@Injectable()
export class CoreTransformationsDomainService {
  constructor(
    private coreTransformationTasksService: CoreTransformationTasksService,
    private preprocessRawTasksService: PreprocessRawTasksService,
    private financialTransactionsService: FinancialTransactionsEntityService,
    private walletsService: WalletsService,
    private logger: LoggerService
  ) {}

  async executeWorkflow(task: CoreTransformationTask) {
    const preprocessRawTask = task.metadata.preprocessRawTaskId
      ? await this.preprocessRawTasksService.get(task.metadata.preprocessRawTaskId)
      : null

    if (!preprocessRawTask || preprocessRawTask.status === TaskStatusEnum.COMPLETED) {
      const preprocessList = await this.financialTransactionsService.getPreprocessHashesByAddressAndChainAndStatus(
        task.address,
        task.blockchainId,
        FinancialTransactionPreprocessStatus.COMPLETED,
        task.metadata.lastCompletedFinancialTransactionPreprocessId
      )

      let lastCompletedFinancialTransactionPreprocessId =
        task.metadata.lastCompletedFinancialTransactionPreprocessId ?? '0'

      if (preprocessList?.length > 0) {
        const distinctHashes: Set<string> = new Set<string>()
        for (const preprocess of preprocessList) {
          distinctHashes.add(preprocess.hash)
          if (new Decimal(preprocess.id).greaterThan(lastCompletedFinancialTransactionPreprocessId)) {
            lastCompletedFinancialTransactionPreprocessId = preprocess.id
          }
        }

        const currentWallet = await this.walletsService.getByOrganizationIdAndAddress(
          task.organizationId,
          task.address,
          {
            walletGroup: true
          }
        )
        const organizationWalletsMap = await this.walletsService.getAllByOrganizationIdGroupedByAddress(
          task.organizationId,
          {
            walletGroup: true
          }
        )
        organizationWalletsMap?.delete(currentWallet.address)

        for (const hash of distinctHashes) {
          const preprocessTransactions = await this.financialTransactionsService.getPreprocessTransactionsByHash(
            hash,
            FinancialTransactionPreprocessStatus.COMPLETED
          )

          await this.createFinancialTransaction(
            preprocessTransactions,
            task.address,
            task.organizationId,
            currentWallet,
            organizationWalletsMap
          )
        }
      }

      await this.coreTransformationTasksService.updateMetadata(task.id, {
        ...task.metadata,
        lastCompletedFinancialTransactionPreprocessId: lastCompletedFinancialTransactionPreprocessId
      })

      await this.coreTransformationTasksService.changeStatus(task.id, TaskStatusEnum.COMPLETED)
    }
  }

  async createFinancialTransaction(
    financialTransactionPreprocessList: FinancialTransactionPreprocess[],
    address: string,
    organizationId: string,
    currentWallet: Wallet,
    organizationWalletsMap: Map<string, Wallet>
  ) {
    let childTransactionDtos: CreateFinancialTransactionChildDto[] = []

    // Split into the different cryptocurrency
    const cryptocurrencyMap: { [cryptocurrencyId: string]: FinancialTransactionPreprocess[] } = {}

    for (const preprocess of financialTransactionPreprocessList) {
      if (!cryptocurrencyMap[preprocess.cryptocurrency.id]) {
        cryptocurrencyMap[preprocess.cryptocurrency.id] = []
      }

      cryptocurrencyMap[preprocess.cryptocurrency.id].push(preprocess)
    }

    const preprocessSpecialAccount: string[] = Object.values(FinancialTransactionPreprocessSpecialAccount)

    for (const [cryptocurrencyId, preprocessGroupByCryptocurrencyList] of Object.entries(cryptocurrencyMap)) {
      const tempResults: CreateFinancialTransactionChildDto[] = []
      const opposingResults: CreateFinancialTransactionChildDto[] = []

      for (const preprocessGroupedByCryptocurrency of preprocessGroupByCryptocurrencyList) {
        try {
          let from = preprocessGroupedByCryptocurrency.fromAddress
          const to = preprocessGroupedByCryptocurrency.toAddress
          let proxy = null
          let type = null
          const amount = preprocessGroupedByCryptocurrency.cryptocurrencyAmount
          let gainLossInclusionStatus = null

          // For edge case where the from and to are the same address. https://etherscan.io/tx/0x3adf80e9b174cbe229b3a3ecc796dbe588b7388a2fc83a97d86ff9b51529fc00
          if (from === to) {
            type = FinancialTransactionChildMetadataType.DEPOSIT
            gainLossInclusionStatus = GainLossInclusionStatus.INTERNAL

            const opposingResult: CreateFinancialTransactionChildDto = {
              publicId: preprocessGroupedByCryptocurrency.uniqueId,
              hash: preprocessGroupedByCryptocurrency.hash,
              blockchainId: preprocessGroupedByCryptocurrency.blockchainId,
              type: FinancialTransactionChildMetadataType.WITHDRAWAL,
              direction: null,
              fromAddress: from,
              toAddress: to,
              proxyAddress: proxy,
              cryptocurrency: preprocessGroupedByCryptocurrency.cryptocurrency,
              cryptocurrencyAmount: amount.toString(),
              valueTimestamp: preprocessGroupedByCryptocurrency.valueTimestamp,
              status: FinancialTransactionChildMetadataStatus.SYNCING,
              organizationId: organizationId,
              financialTransactionParent: null,
              gainLossInclusionStatus: gainLossInclusionStatus
            }

            opposingResults.push(opposingResult)
          } else if (!preprocessSpecialAccount.includes(to)) {
            let indexToRemove = -1

            for (let i = 0; i < tempResults.length; i++) {
              const previousResult = tempResults[i]

              if (previousResult.toAddress === from) {
                const leftover = Decimal.sub(previousResult.cryptocurrencyAmount, amount)
                if (leftover.greaterThanOrEqualTo(0)) {
                  proxy = previousResult.toAddress
                  from = previousResult.fromAddress

                  // For edge case where the money is returned back to the user. https://etherscan.io/tx/0x7b2543c88e1305e3968f6da36147619bf2e6f410fdda316fa15ebdc4bbbdca4c
                  if (previousResult.toAddress === previousResult.fromAddress) {
                    continue
                  }

                  if (from === to) {
                    type = FinancialTransactionChildMetadataType.DEPOSIT
                    gainLossInclusionStatus = GainLossInclusionStatus.INTERNAL

                    // Need to be different than the original one. w is not is hexadecimal range. the last character will be overwritten later
                    const modifiedUniqueId = preprocessGroupedByCryptocurrency.uniqueId.slice(0, 30).concat('ww')

                    let hackExist = opposingResults.splice(
                      opposingResults.findIndex(
                        (temp) =>
                          temp.publicId === modifiedUniqueId &&
                          temp.type === FinancialTransactionChildMetadataType.WITHDRAWAL
                      ),
                      1
                    )

                    if (hackExist?.at(0)) {
                      hackExist.at(0).cryptocurrencyAmount = Decimal.add(
                        hackExist.at(0).cryptocurrencyAmount,
                        amount
                      ).toString()

                      opposingResults.push(hackExist[0])
                    } else {
                      const opposingResult: CreateFinancialTransactionChildDto = { ...previousResult }
                      opposingResult.type = FinancialTransactionChildMetadataType.WITHDRAWAL
                      opposingResult.publicId = modifiedUniqueId
                      opposingResult.fromAddress = from
                      opposingResult.toAddress = to
                      opposingResult.proxyAddress = proxy
                      opposingResult.cryptocurrencyAmount = amount.toString()
                      opposingResult.gainLossInclusionStatus = gainLossInclusionStatus

                      opposingResults.push(opposingResult)
                    }
                  }

                  previousResult.cryptocurrencyAmount = leftover.toString()

                  if (leftover.equals(0)) {
                    indexToRemove = i
                  }

                  break
                }
              }
            }

            if (indexToRemove > -1) {
              tempResults.splice(indexToRemove, 1)
            }
          }

          const dto: CreateFinancialTransactionChildDto = {
            publicId: preprocessGroupedByCryptocurrency.uniqueId,
            hash: preprocessGroupedByCryptocurrency.hash,
            blockchainId: preprocessGroupedByCryptocurrency.blockchainId,
            type: type ?? null,
            direction: null,
            fromAddress: from,
            toAddress: to,
            proxyAddress: proxy,
            cryptocurrency: preprocessGroupedByCryptocurrency.cryptocurrency,
            cryptocurrencyAmount: amount.toString(),
            valueTimestamp: preprocessGroupedByCryptocurrency.valueTimestamp,
            status: FinancialTransactionChildMetadataStatus.SYNCING,
            organizationId: organizationId,
            financialTransactionParent: null,
            gainLossInclusionStatus: gainLossInclusionStatus ?? GainLossInclusionStatus.ALL
          }

          tempResults.push(dto)
        } catch (e) {
          this.logger.log('createFinancialTransaction fail for', preprocessGroupedByCryptocurrency, e)
        }
      }

      childTransactionDtos = childTransactionDtos.concat(opposingResults).concat(tempResults)
    }

    childTransactionDtos = childTransactionDtos
      .filter((e) => e)
      .filter((dto) => dto.fromAddress === address || dto.toAddress === address)

    let fromCount = 0
    let toCount = 0

    for (const dto of childTransactionDtos) {
      if (dto.type === FinancialTransactionChildMetadataType.DEPOSIT) {
        fromCount++
      } else if (dto.type === FinancialTransactionChildMetadataType.WITHDRAWAL) {
        toCount++
      } else {
        if (dto.fromAddress === dto.toAddress) {
          // Withdrawal leg is created above
          dto.type = FinancialTransactionChildMetadataType.DEPOSIT
        } else if (address === dto.toAddress) {
          dto.type = FinancialTransactionChildMetadataType.DEPOSIT
          fromCount++
        } else {
          dto.type = FinancialTransactionChildMetadataType.WITHDRAWAL
          if (dto.toAddress === FinancialTransactionPreprocessSpecialAccount.GAS_FEE_ACCOUNT) {
            dto.type = FinancialTransactionChildMetadataType.FEE
            dto.toAddress = null
          }

          toCount++
        }
      }

      if (
        (currentWallet.address === dto.fromAddress && organizationWalletsMap?.get(dto.toAddress)) ||
        (currentWallet.address === dto.toAddress && organizationWalletsMap?.get(dto.fromAddress))
      ) {
        const counterpartyWallet =
          organizationWalletsMap?.get(dto.toAddress) || organizationWalletsMap?.get(dto.fromAddress)
        if (counterpartyWallet) {
          if (currentWallet.walletGroup.id === counterpartyWallet.walletGroup.id) {
            if (dto.type === FinancialTransactionChildMetadataType.DEPOSIT) {
              dto.type = FinancialTransactionChildMetadataType.DEPOSIT_INTERNAL
            } else if (dto.type === FinancialTransactionChildMetadataType.WITHDRAWAL) {
              dto.type = FinancialTransactionChildMetadataType.WITHDRAWAL_INTERNAL
            }
            dto.gainLossInclusionStatus = GainLossInclusionStatus.INTERNAL
          } else if (currentWallet.walletGroup.id !== counterpartyWallet.walletGroup.id) {
            if (dto.type === FinancialTransactionChildMetadataType.DEPOSIT) {
              dto.type = FinancialTransactionChildMetadataType.DEPOSIT_GROUP
            } else if (dto.type === FinancialTransactionChildMetadataType.WITHDRAWAL) {
              dto.type = FinancialTransactionChildMetadataType.WITHDRAWAL_GROUP
            }
            dto.gainLossInclusionStatus = GainLossInclusionStatus.ALL
          }
        }
      }
    }

    const parent = await this.createParent(organizationId, financialTransactionPreprocessList[0], fromCount, toCount)

    // For UI layout purpose, fee should be shown last. At this point, there is only 1 fee per transaction
    const feeIndex = childTransactionDtos.findIndex(
      (element) => element.type === FinancialTransactionChildMetadataType.FEE
    )
    if (feeIndex != -1) {
      childTransactionDtos.push(childTransactionDtos.splice(feeIndex, 1)[0])
    }

    for (const dto of childTransactionDtos) {
      dto.financialTransactionParent = parent
      CreateFinancialTransactionChildDto.updatePublicIdAndDirectionBasedOnType(dto)
      await this.financialTransactionsService.createOrUpdateChild(dto)
    }
  }

  async createParent(
    organizationId: string,
    financialTransactionPreprocessSample: FinancialTransactionPreprocess,
    fromCount: number,
    toCount: number
  ) {
    const activity = this.financialTransactionsService.getParentActivity({ fromCount, toCount })

    const createFinancialTransactionParentDto: CreateFinancialTransactionParentDto = {
      hash: financialTransactionPreprocessSample.hash,
      blockchainId: financialTransactionPreprocessSample.blockchainId,
      activity: activity,
      status: FinancialTransactionParentStatus.ACTIVE,
      organizationId: organizationId,
      valueTimestamp: financialTransactionPreprocessSample.valueTimestamp
    }

    return this.financialTransactionsService.createOrUpdateParent(createFinancialTransactionParentDto)
  }
}
