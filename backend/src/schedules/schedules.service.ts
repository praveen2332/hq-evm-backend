import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'
import { AxiosResponse } from 'axios'
import { format } from 'date-fns'
import { Contract, providers } from 'ethers'
import { Interface, formatEther, formatUnits } from 'ethers/lib/utils'
import { EMPTY, Observable, expand, forkJoin, from, lastValueFrom, map, switchMap } from 'rxjs'
import {
  BSC_CHAIN_ID,
  DisperseABI,
  ETHEREUM_CHAIN_ID,
  Erc20ABI,
  GOERLI_CHAIN_ID,
  GnosisService,
  MAIN_FIAT_CURRENCY,
  POLYGON_CHAIN_ID,
  ScanAPIs,
  SupportedChains,
  networkConfigs
} from '../common/constants'
import { LoggerService } from '../common/logger/logger.service'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { ChainsService } from '../common/services/chains/chains.service'
import { InvitationsService } from '../common/services/invitations/invitations.service'
import { PricesService } from '../prices/prices.service'
import { SafeOwnerState, SourceType } from '../source-of-funds/interfaces'
import { SourceEth } from '../source-of-funds/source-eth-eoa/source-eth-eoa.entity'
import { SourceEthService } from '../source-of-funds/source-eth-eoa/source-eth-eoa.service'
import { SourceFtx } from '../source-of-funds/source-ftx/source-ftx.entity'
import { SourceFtxService } from '../source-of-funds/source-ftx/source-ftx.service'
import { SourceGnosis } from '../source-of-funds/source-gnosis/source-gnosis.entity'
import { SourceGnosisService } from '../source-of-funds/source-gnosis/source-gnosis.service'
import { SourceOfFund, SourceOfFundGnosis } from '../source-of-funds/source-of-fund.entity'
import { SourceOfFundsService } from '../source-of-funds/source-of-funds.service'
import {
  EFTXTransactionStatus,
  EGnosisSafeMethod,
  EMetamaskMethod,
  ETransactionType,
  FTXTransaction,
  MetamaskTransaction,
  SafeTransaction
} from '../transactions/interfaces'
import { Transaction } from '../transactions/transaction.entity'
import { TransactionsService } from '../transactions/transactions.service'
import { MetamaskResponse, SafeResponse } from './interfaces'

@Injectable()
export class SchedulesService {
  apiKey: string
  disperse: Interface
  erc20: Interface

  constructor(
    private sourceOfFundsService: SourceOfFundsService,
    private sourceGnosisService: SourceGnosisService,
    private sourceFTXService: SourceFtxService,
    private sourceEthService: SourceEthService,
    private transactionsService: TransactionsService,
    private pricesDomainService: PricesService,
    private chainsService: ChainsService,
    private httpService: HttpService,
    private configService: ConfigService,
    private loggerService: LoggerService,
    private invitationsService: InvitationsService
  ) {
    this.apiKey = this.configService.get('COINGECKO_API_KEY')
    this.disperse = new Interface(DisperseABI)
    this.erc20 = new Interface(Erc20ABI)
  }

  private readonly logger = new Logger(SchedulesService.name)

  @Cron('*/15 0-1 * * *', { utcOffset: 0 })
  async scanPricesDaily() {
    console.log('scanPricesDaily job starts...', new Date().toLocaleString())
    try {
      await this.pricesDomainService.syncDaily()
    } catch (error) {
      this.loggerService.error(error)
    }
    console.log('scanPricesDaily job ends...', new Date().toLocaleString())
  }

  @Cron('0 5 * * *', { utcOffset: 0 })
  async scanTransactionsDaily() {
    try {
      const sources = await this.sourceOfFundsService.find({
        where: [{ sourceType: SourceType.GNOSIS }, { sourceType: SourceType.ETH }],
        relations: []
      })
      for (const source of sources) {
        if (source.sourceType === SourceType.GNOSIS) {
          const gnosis = await this.sourceGnosisService.get(source.sourceId)
          if (gnosis) {
            await this.syncGnosisTransactionsWrapper(source, gnosis)
          }
        }
        if (source.sourceType === SourceType.ETH) {
          const eth = await this.sourceEthService.get(source.sourceId)
          if (eth) {
            await this.syncMetamaskTransactionWrapper(source, eth)
          }
        }
        if (source.sourceType === SourceType.FTX) {
          const ftx = await this.sourceFTXService.get(source.sourceId)
          if (ftx) this.syncFTXTransaction(source, ftx)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  //Every hour
  @Cron('0 * * * *', { utcOffset: 0 })
  async updateExpiredInvitations() {
    try {
      await this.invitationsService.updateStatusForExpired()
    } catch (error) {
      this.loggerService.error(error)
    }
  }

  async syncGnosisTransactionsWrapper(source: SourceOfFund, gnosis: SourceGnosis) {
    const result = await this.syncGnosisTransactions(source, gnosis)

    return result
  }

  syncGnosisTransactions(source: SourceOfFund, gnosis: SourceGnosis) {
    const getTransactions = (url: string) => from(this.httpService.get(url))
    const observables: Observable<boolean>[] = []
    const safeInfoUrl = `${GnosisService[gnosis.blockchainId]}/v1/safes/${gnosis.address}`

    lastValueFrom(
      this.httpService.get(safeInfoUrl).pipe(
        map((res) => {
          if (res && res.data && res.data.threshold !== gnosis.threshold) {
            gnosis.threshold = res.data.threshold
            gnosis.ownerAddresses = res.data.owners.map((item) => ({
              name: '',
              address: item,
              state: SafeOwnerState.CURRENT
            }))
            this.sourceGnosisService.update(gnosis)
          }
        })
      )
    )

    // Sync incoming trans
    const incomingUrl = `${GnosisService[gnosis.blockchainId]}/v1/safes/${gnosis.address}/incoming-transfers`

    observables.push(
      getTransactions(incomingUrl).pipe(
        expand((previousData) => (previousData.data.next ? getTransactions(previousData.data.next) : EMPTY)),
        switchMap(async (res: AxiosResponse<SafeResponse<SafeTransaction>>) => {
          const { length } = res.data.results
          const promises = []
          for (let i = 0; i < length; i++) {
            const transaction = res.data.results[i]
            let record = await this.transactionsService.findOne({
              where: { hash: transaction.transactionHash, source: { id: source.id } },
              relations: ['source']
            })
            if (!record) {
              record = new Transaction()
            }
            const url = `${ScanAPIs[gnosis.blockchainId]}?module=proxy&action=eth_getTransactionReceipt&txhash=${
              transaction.transactionHash
            }&apikey=${this.getScanApiKey(gnosis.blockchainId)}`
            const transactionByHash = await lastValueFrom(this.httpService.get(url))
            record.blockchainId = gnosis.blockchainId
            record.source = source
            record.hash = transaction.transactionHash
            record.timeStamp = transaction.executionDate ? new Date(transaction.executionDate) : null
            const gasPrice = transactionByHash?.data?.result?.effectiveGasPrice || 0
            const gasUsed = transactionByHash?.data?.result?.gasUsed || 0
            record.safeTransaction = {
              ...transaction,
              gasPrice,
              gasUsed,
              fee: (Number(gasPrice) * Number(gasUsed)).toString()
            }
            record.isExecuted = true
            record.safeTransaction.confirmationsRequired = gnosis.threshold
            record.safeTransaction.incoming = true
            record.type = ETransactionType.INCOMING

            if (transaction.tokenAddress) {
              const amounts = [transaction.value]
              const addresses = [transaction.to]
              const tokenAddress = transaction.tokenAddress
              const decimals = transaction.tokenInfo ? transaction.tokenInfo.decimals : 18
              const symbol = transaction.tokenInfo ? transaction.tokenInfo.symbol : ''
              record.symbol = symbol
              await this.tokenTransfer(
                record,
                transaction.executionDate,
                gnosis.blockchainId,
                amounts,
                addresses,
                tokenAddress,
                decimals
              )
            } else {
              const amounts = [transaction.value]
              const addresses = [transaction.to]
              await this.coinTransfer(record, transaction.executionDate, gnosis.blockchainId, amounts, addresses)
            }
            await this.transactionsService.create(record)
          }
          await Promise.all(promises)
          this.logger.log('Sync incoming transactions done')
          return true
        })
      )
    )

    // Sync outgoing trans & queue
    const outgoingUrl = `${GnosisService[gnosis.blockchainId]}/v1/safes/${
      gnosis.address
    }/multisig-transactions?trust=true`

    let transactions: SafeTransaction[] = []
    observables.push(
      getTransactions(outgoingUrl).pipe(
        expand((previousData) => {
          return previousData.data.next ? getTransactions(previousData.data.next) : EMPTY
        }),
        switchMap(async (res: AxiosResponse<SafeResponse<SafeTransaction>>) => {
          transactions = transactions.concat(res.data.results)
          const { length } = res.data.results
          const promises = []
          for (let i = 0; i < length; i++) {
            promises.push(
              new Promise(async (resolve, reject) => {
                let transaction = res.data.results[i]
                let tempTransaction: SafeTransaction
                try {
                  let record = await this.transactionsService.findOne({
                    where: { safeHash: transaction.safeTxHash, source: { id: source.id } },
                    relations: ['source']
                  })

                  if (
                    transaction.to.toLowerCase() === gnosis.address.toLowerCase() &&
                    transaction.isExecuted &&
                    transaction.data
                  ) {
                    if (record && !record.isExecuted) {
                      if (
                        transaction.dataDecoded &&
                        Object.values(EGnosisSafeMethod).find((method) => method === transaction?.dataDecoded?.method)
                      ) {
                        this.transactionsService.remove(record)
                      } else {
                        record.isExecuted = transaction.isExecuted
                        record.safeTransaction = {
                          ...transaction,
                          confirmationsRequired: record?.safeTransaction?.confirmationsRequired
                        }
                        record.hash = transaction.transactionHash
                        record.timeStamp = new Date(transaction.executionDate)

                        this.transactionsService.update(record)
                      }
                    }
                    resolve(true)
                    return
                  }

                  let sameNonceTransaction = transactions.find((item) => {
                    return item.nonce === transaction.nonce && transaction.safeTxHash !== item.safeTxHash
                  })

                  // @TODO: if the last result is reject transaction, find the same nonce transaction
                  if (i === length - 1 && !sameNonceTransaction && !transaction.data && transaction.value === '0') {
                    const nonceUrl = outgoingUrl + `&nonce=${transaction.nonce}`
                    const executedTransfer = await lastValueFrom(
                      this.httpService.get(nonceUrl).pipe(
                        switchMap(async (res) => {
                          if (res.data.results && res.data.results.length > 1) {
                            sameNonceTransaction = res.data.results.find(
                              (item) => item && item.safeTxHash !== transaction.safeTxHash && !item.isExecuted
                            )
                            return !sameNonceTransaction
                          }
                          return false
                        })
                      )
                    )

                    if (executedTransfer) {
                      resolve(true)

                      return
                    }
                  }

                  if (sameNonceTransaction) {
                    // @TODO: self remove because sameNonceTransaction is executed
                    if (sameNonceTransaction.isExecuted) {
                      const records = await this.transactionsService.getPendingTransactionsByNonce(
                        source.id,
                        transaction.nonce
                      )

                      if (records) await this.transactionsService.removeAll(records)
                      resolve(true)
                      return
                    } else {
                      // @TODO: if not reject transaction, self remove
                      if (transaction.value === '0' && !transaction.data) {
                        tempTransaction = res.data.results[i]
                        transaction = {
                          ...sameNonceTransaction,
                          isExecuted: tempTransaction.isExecuted,
                          executionDate: tempTransaction.executionDate,
                          safeTxHash: tempTransaction.safeTxHash,
                          transactionHash: tempTransaction.transactionHash,
                          confirmations: tempTransaction.confirmations,
                          ethGasPrice: tempTransaction.ethGasPrice,
                          fee: tempTransaction.fee,
                          gasUsed: tempTransaction.gasUsed
                        }
                      } else {
                        if (record) await this.transactionsService.remove(record)
                        resolve(true)

                        return
                      }
                    }
                  }

                  if (!record) {
                    record = new Transaction()
                  }

                  record.blockchainId = gnosis.blockchainId
                  record.source = source
                  record.hash = transaction.transactionHash
                  record.safeHash = transaction.safeTxHash
                  record.timeStamp = transaction.executionDate ? new Date(transaction.executionDate) : null
                  record.submissionDate = new Date(transaction.submissionDate)
                  record.safeTransaction = transaction
                  record.isExecuted = transaction.isExecuted
                  record.safeTransaction.confirmationsRequired = gnosis.threshold
                  if (!record.hash) {
                    record.type = ETransactionType.QUEUE
                  } else {
                    record.type = ETransactionType.OUTGOING
                  }

                  if (!transaction.dataDecoded) {
                    const amounts = [transaction.value]
                    const addresses = [transaction.to]
                    await this.coinTransfer(record, transaction.executionDate, gnosis.blockchainId, amounts, addresses)
                  } else {
                    record.method = transaction.dataDecoded.method
                  }

                  const chainId = gnosis.blockchainId === SupportedBlockchains.GOERLI ? 5 : 1

                  if (transaction.dataDecoded && transaction.dataDecoded.method === EGnosisSafeMethod.TRANSFER) {
                    const amounts = [transaction.dataDecoded.parameters[1].value]
                    const addresses = [transaction.dataDecoded.parameters[0].value]
                    const tokenAddress = transaction.to
                    const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
                    const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
                    const decimals = await tokenContract.decimals()
                    const symbol = await tokenContract.symbol()
                    record.symbol = symbol
                    await this.tokenTransfer(
                      record,
                      transaction.executionDate,
                      gnosis.blockchainId,
                      amounts,
                      addresses,
                      tokenAddress,
                      decimals
                    )
                  }

                  if (transaction.dataDecoded && transaction.dataDecoded.method === EGnosisSafeMethod.MULTISEND) {
                    const { valueDecoded } = transaction.dataDecoded.parameters[0]

                    if (valueDecoded[0].dataDecoded) {
                      // token
                      const amounts = valueDecoded.map((recipient) => recipient.dataDecoded.parameters[1].value)
                      const addresses = valueDecoded.map((recipient) => recipient.dataDecoded.parameters[0].value)
                      const tokenAddress = valueDecoded[0].to
                      const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
                      const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
                      const decimals = await tokenContract.decimals()
                      const symbol = await tokenContract.symbol()
                      record.symbol = symbol
                      await this.tokenTransfer(
                        record,
                        transaction.executionDate,
                        gnosis.blockchainId,
                        amounts,
                        addresses,
                        tokenAddress,
                        decimals
                      )
                    } else {
                      // ETH
                      const amounts = valueDecoded.map((recipient) => recipient.value)
                      const addresses = valueDecoded.map((recipient) => recipient.to)
                      await this.coinTransfer(
                        record,
                        transaction.executionDate,
                        gnosis.blockchainId,
                        amounts,
                        addresses
                      )
                    }
                  }
                  if (tempTransaction) {
                    record.safeTransaction = {
                      ...tempTransaction,
                      fee: record?.safeTransaction?.fee,
                      gasPrice: record?.safeTransaction?.gasPrice,
                      gasUsed: record?.safeTransaction?.gasUsed,
                      confirmationsRequired: gnosis.threshold,
                      confirmations:
                        (tempTransaction.isExecuted && tempTransaction.confirmations) ||
                        record.safeTransaction.confirmations,
                      isExecuted: tempTransaction.isExecuted || record.isExecuted
                    }
                    record.safeHash = tempTransaction.safeTxHash
                    record.isExecuted = tempTransaction.isExecuted || record.isExecuted
                  }

                  await this.transactionsService.create(record)

                  resolve(true)
                } catch (error) {
                  this.logger.error(`Error: ${error}`)
                  reject(false)
                }
              })
            )
          }
          await Promise.all(promises)
          this.logger.log('Sync queue & outgoing transactions done')
          return true
        })
      )
    )

    return lastValueFrom(forkJoin(observables).pipe(map(() => true)))
  }

  async tokenTransfer(
    record: Transaction,
    executionDate: string | number,
    blockchainId: string,
    amounts: string[],
    addresses: string[],
    tokenAddress: string,
    decimals = 18
  ) {
    const chainId = blockchainId === SupportedBlockchains.GOERLI ? 5 : 1
    const supportedToken = networkConfigs[chainId].tokens.find(
      (token) => token && token.toLowerCase() === tokenAddress.toLowerCase()
    )
    record.tokenAddress = tokenAddress
    if (supportedToken && executionDate) {
      record.symbol = networkConfigs[chainId][supportedToken].symbol
      const date = format(new Date(executionDate), 'dd-MM-yyyy')
      await this.getTransactionRecipients(record, amounts, addresses, networkConfigs[chainId][supportedToken], date)
      await this.calculatePastGasFee(record, networkConfigs[chainId]['default'], date)
    } else if (supportedToken) {
      record.symbol = networkConfigs[chainId][supportedToken].symbol
      record.recipients = amounts.map((amount, index) => ({
        address: addresses[index],
        amount: formatUnits(amount, networkConfigs[chainId][supportedToken].decimals),
        pastUSDPrice: undefined
      }))
    } else {
      record.recipients = amounts.map((amount, index) => ({
        address: addresses[index],
        amount: formatUnits(amount, decimals),
        pastUSDPrice: undefined
      }))
    }
  }

  async coinTransfer(
    record: Transaction,
    executionDate: string | number,
    blockchainId: string,
    amounts: string[],
    addresses: string[]
  ) {
    const chainId = blockchainId === SupportedBlockchains.GOERLI ? 5 : 1
    record.tokenAddress = ''
    record.symbol = networkConfigs[chainId].default.symbol
    if (executionDate) {
      const date = format(new Date(executionDate), 'dd-MM-yyyy')
      await this.getTransactionRecipients(record, amounts, addresses, networkConfigs[chainId].default, date)
      await this.calculatePastGasFee(record, networkConfigs[chainId].default, date)
    } else {
      record.recipients = amounts.map((amount, index) => ({
        address: addresses[index],
        amount: formatEther(amount),
        pastUSDPrice: undefined
      }))
    }
  }

  async getTransactionRecipients(
    record: Transaction,
    amounts: string[],
    addresses: string[],
    token: {
      id: string
      symbol: string
      decimals: number
    },
    date: string
  ) {
    const { length } = amounts
    record.recipients = []
    const tokenUsdPrice = await this.pricesDomainService.getPriceByCurrency(date, token.symbol, MAIN_FIAT_CURRENCY)

    for (let i = 0; i < length; i++) {
      const pastUSDPrice =
        (tokenUsdPrice && Number(tokenUsdPrice) * Number(formatUnits(amounts[i], token.decimals))) || undefined
      record.recipients.push({
        address: addresses[i],
        amount: formatUnits(amounts[i], token.decimals),
        pastUSDPrice
      })
    }
  }

  async calculatePastGasFee(
    record: Transaction,
    token: {
      id: string
      symbol: string
      decimals: number
    },
    date: string
  ) {
    try {
      const tokenPrice = await this.pricesDomainService.getPriceByCurrency(date, token.symbol, MAIN_FIAT_CURRENCY)
      const gasUsed =
        record.metamaskTransaction && record.metamaskTransaction.gasUsed && Number(record.metamaskTransaction.gasUsed)

      const gasPrice =
        record.metamaskTransaction && record.metamaskTransaction.gasPrice && Number(record.metamaskTransaction.gasPrice)

      const fee =
        (gasPrice && gasUsed && formatEther((Number(gasPrice) * Number(gasUsed)).toString())) ||
        (record.safeTransaction && record.safeTransaction.fee && formatEther(record.safeTransaction.fee))

      record.pastUSDGasFee = String(Number(fee) * Number(tokenPrice))
    } catch (error) {
      this.logger.error(`Can not calculate gas fee`, error, {
        txHash: record.hash,
        token,
        date
      })
      //
    }
  }

  async syncMetamaskTransactionWrapper(source: SourceOfFund, eth: SourceEth): Promise<boolean> {
    const result = await this.syncMetamaskTransaction(source, eth)

    return result
  }

  syncMetamaskTransaction(source: SourceOfFund, eth: SourceEth): Promise<boolean> {
    const { length } = SupportedChains
    const observables: Observable<MetamaskTransaction[]>[] = []
    const erc20Transactions: Array<MetamaskTransaction[]> = []
    for (let i = 0; i < length; i++) {
      const erc20Url = `${ScanAPIs[SupportedChains[i]]}?module=account&action=tokentx&address=${
        eth.address
      }&page=1&offset=1000&sort=desc&apikey=${this.getScanApiKey(SupportedChains[i])}`
      const url = `${ScanAPIs[SupportedChains[i]]}?module=account&action=txlist&address=${
        eth.address
      }&page=1&offset=1000&sort=desc&apikey=${this.getScanApiKey(SupportedChains[i])}`
      observables.push(
        this.httpService.get(erc20Url).pipe(
          switchMap((res: AxiosResponse<MetamaskResponse<MetamaskTransaction>>) => {
            erc20Transactions[i] = res?.data?.result?.filter(
              (transaction) => transaction.to.toLowerCase() === eth.address.toLowerCase()
            )
            return this.httpService.get(url).pipe(
              map((history: AxiosResponse<MetamaskResponse<MetamaskTransaction>>) => {
                return history.data.result.filter(
                  (transaction) => !erc20Transactions[i].find((item) => item.hash === transaction.hash)
                )
              })
            )
          })
        )
      )
    }

    return lastValueFrom(
      forkJoin(observables).pipe(
        switchMap(async (res) => {
          for (let i = 0; i < length; i++) {
            const transactionLength = res[i].length
            const transactions = []
            for (let j = 0; j < transactionLength; j++) {
              transactions.push(
                new Promise(async (resolve, reject) => {
                  const transaction = res[i][j]
                  let record = await this.transactionsService.findOne({
                    where: { hash: transaction.hash, source: { id: source.id } },
                    relations: ['source']
                  })
                  if (!record) {
                    record = new Transaction()
                  }
                  const chainId = this.getChainId(SupportedChains[i])
                  record.blockchainId = SupportedChains[i]
                  record.source = source
                  record.hash = transaction.hash
                  record.timeStamp = new Date(Number(transaction.timeStamp) * 1000)
                  record.metamaskTransaction = transaction
                  record.isExecuted = true

                  if (transaction.from && transaction.from.toLowerCase() === eth.address.toLowerCase()) {
                    record.type = ETransactionType.OUTGOING
                  } else {
                    record.type = ETransactionType.INCOMING
                  }
                  await this.decodeRecipients(record, transaction, SupportedChains[i])
                  resolve(true)
                })
              )
            }
            await Promise.all(transactions)
          }

          return true
        }),
        switchMap(async () => {
          for (let i = 0; i < length; i++) {
            const incomingTransactionsLength = erc20Transactions[i].length
            const transactions = []
            for (let j = 0; j < incomingTransactionsLength; j++) {
              transactions.push(
                new Promise(async (resolve, reject) => {
                  const transaction = erc20Transactions[i][j]
                  let record = await this.transactionsService.findOne({
                    where: { hash: transaction.hash, source: { id: source.id } },
                    relations: ['source']
                  })
                  if (!record) {
                    record = new Transaction()
                  }
                  const chainId = this.getChainId(SupportedChains[i])
                  const chain = await this.chainsService.get(chainId)
                  record.blockchainId = SupportedChains[i]
                  record.source = source
                  record.hash = transaction.hash
                  record.timeStamp = new Date(Number(transaction.timeStamp) * 1000)
                  record.metamaskTransaction = transaction
                  record.isExecuted = true

                  const amounts = [transaction.value]
                  const addresses = [transaction.to]
                  const tokenAddress = transaction.contractAddress
                  record.method = EMetamaskMethod.TRANSFER
                  const decimals = +transaction.tokenDecimal
                  const symbol = transaction.tokenSymbol
                  record.symbol = symbol
                  if (transaction.from && transaction.from.toLowerCase() === eth.address.toLowerCase()) {
                    record.type = ETransactionType.OUTGOING
                  } else {
                    record.type = ETransactionType.INCOMING
                  }
                  await this.tokenTransfer(
                    record,
                    Number(transaction.timeStamp) * 1000,
                    SupportedChains[i],
                    amounts,
                    addresses,
                    tokenAddress,
                    decimals
                  )

                  resolve(true)
                })
              )
            }

            await Promise.all(transactions)
          }
          return true
        })
      )
    )
  }

  async syncFTXTransaction(source: SourceOfFund, ftx: SourceFtx) {
    const client = this.sourceOfFundsService.getSourceFTX(ftx.apiKey, ftx.secretKey, ftx.subAccountName)
    const res = await client.getWithdrawalHistory()
    if (res && res.result && res.result.length) {
      const transactions = res.result
      const length = transactions.length
      for (let i = 0; i < length; i++) {
        const transaction: FTXTransaction = transactions[i]
        let record = await this.transactionsService.findOne({
          where: { hash: transaction.txid, source: { id: source.id } },
          relations: ['source']
        })
        if (!record) {
          record = new Transaction()
        }
        record.source = source
        record.hash = transaction.txid
        record.timeStamp = new Date(Number(transaction.time) * 1000)
        record.ftxTransaction = transaction
        record.isExecuted =
          transaction.status === EFTXTransactionStatus.COMPLETE ||
          transaction.status === EFTXTransactionStatus.CONFIRMED
        record.recipients = [
          {
            address: transaction.address,
            amount: transaction.size.toString(),
            pastUSDPrice: null
          }
        ]
        this.transactionsService.create(record)
      }
    }
  }

  async decodeRecipients(record: Transaction, transaction: MetamaskTransaction, blockchainId: string) {
    const chainId = blockchainId === SupportedBlockchains.GOERLI ? 5 : 1
    if (transaction.value === '0') {
      // @TODO: get abi contract from transaction.to
      if (transaction.functionName.includes(EMetamaskMethod.DISPERSE_TOKEN)) {
        const dataDecoded = this.disperse.decodeFunctionData(EMetamaskMethod.DISPERSE_TOKEN, transaction.input)
        const amounts = dataDecoded[2].map((amount) => amount.toString())
        const addresses = dataDecoded[1]
        const tokenAddress = dataDecoded[0]
        record.method = EMetamaskMethod.DISPERSE_TOKEN
        const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
        const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
        const decimals = await tokenContract.decimals()
        const symbol = await tokenContract.symbol()
        record.symbol = symbol
        await this.tokenTransfer(
          record,
          Number(transaction.timeStamp) * 1000,
          blockchainId,
          amounts,
          addresses,
          tokenAddress,
          decimals
        )
        await this.transactionsService.create(record)
      } else if (transaction.functionName.includes(EMetamaskMethod.TRANSFER + '(')) {
        const dataDecoded = this.erc20.decodeFunctionData(EMetamaskMethod.TRANSFER, transaction.input)
        const amounts = [dataDecoded[1].toString()]
        const addresses = [dataDecoded[0]]
        const tokenAddress = transaction.to
        record.method = EMetamaskMethod.TRANSFER
        const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
        const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
        const decimals = await tokenContract.decimals()
        const symbol = await tokenContract.symbol()
        record.symbol = symbol
        await this.tokenTransfer(
          record,
          Number(transaction.timeStamp) * 1000,
          blockchainId,
          amounts,
          addresses,
          tokenAddress,
          decimals
        )
        await this.transactionsService.create(record)
      } else {
        record.method = transaction.functionName ? transaction.functionName.split('(')[0] : ''
        const date = format(new Date(Number(transaction.timeStamp) * 1000), 'dd-MM-yyyy')
        await this.calculatePastGasFee(record, networkConfigs[chainId]['default'], date)
        await this.transactionsService.create(record)
      }
    } else {
      if (transaction.input === '0x') {
        const amounts = [transaction.value]
        const addresses = [transaction.to]
        record.method = ''
        await this.coinTransfer(record, Number(transaction.timeStamp) * 1000, blockchainId, amounts, addresses)
        await this.transactionsService.create(record)
      } else {
        if (transaction.functionName.includes(EMetamaskMethod.DISPERSE_ETHER)) {
          const dataDecoded = this.disperse.decodeFunctionData(EMetamaskMethod.DISPERSE_ETHER, transaction.input)
          const amounts = dataDecoded[1].map((amount) => amount.toString())
          const addresses = dataDecoded[0]
          record.method = EMetamaskMethod.DISPERSE_ETHER
          await this.coinTransfer(record, Number(transaction.timeStamp) * 1000, blockchainId, amounts, addresses)
          await this.transactionsService.create(record)
        } else if (transaction.functionName.includes(EMetamaskMethod.DISPERSE_TOKEN)) {
          const dataDecoded = this.disperse.decodeFunctionData(EMetamaskMethod.DISPERSE_TOKEN, transaction.input)
          const amounts = dataDecoded[2].map((amount) => amount.toString())
          const addresses = dataDecoded[1]
          const tokenAddress = dataDecoded[0]
          record.method = EMetamaskMethod.DISPERSE_TOKEN
          const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
          const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
          const decimals = await tokenContract.decimals()
          const symbol = await tokenContract.symbol()
          record.symbol = symbol
          await this.tokenTransfer(
            record,
            Number(transaction.timeStamp) * 1000,
            blockchainId,
            amounts,
            addresses,
            tokenAddress,
            decimals
          )
          await this.transactionsService.create(record)
        } else if (transaction.functionName.includes(EMetamaskMethod.TRANSFER)) {
          const dataDecoded = this.erc20.decodeFunctionData(EMetamaskMethod.TRANSFER, transaction.input)
          const amounts = [dataDecoded[1].toString()]
          const addresses = [dataDecoded[0]]
          const tokenAddress = transaction.to
          record.method = EMetamaskMethod.TRANSFER
          const provider = new providers.JsonRpcProvider(networkConfigs[blockchainId].rpcUrl)
          const tokenContract = new Contract(tokenAddress, Erc20ABI, provider)
          const decimals = await tokenContract.functions.decimals()
          const symbol = await tokenContract.symbol()
          record.symbol = symbol
          await this.tokenTransfer(
            record,
            Number(transaction.timeStamp) * 1000,
            blockchainId,
            amounts,
            addresses,
            tokenAddress,
            decimals
          )
          await this.transactionsService.create(record)
        } else {
          // @TODO: get abi contract from transaction.to
          const date = format(new Date(Number(transaction.timeStamp) * 1000), 'dd-MM-yyyy')
          record.method = transaction.functionName ? transaction.functionName.split('(')[0] : ''

          await this.calculatePastGasFee(record, networkConfigs[chainId]['default'], date)
          await this.transactionsService.create(record)
        }
      }
    }
  }

  getScanApiKey(chain: string) {
    switch (chain) {
      case 'ethereum':
        return this.configService.get('ETHERSCAN_API_KEY')
      case 'rinkeby':
        return this.configService.get('ETHERSCAN_API_KEY')
      case 'goerli':
        return this.configService.get('ETHERSCAN_API_KEY')
      case 'polygon':
        return this.configService.get('POLYGONSCAN_API_KEY')
      case 'bsc':
        return this.configService.get('BSCSCAN_API_KEY')
      default:
        return this.configService.get('ETHERSCAN_API_KEY')
    }
  }

  // @TODO: get safe data from gnosis service
  async getSafeGnosis(gnosis: SourceOfFundGnosis) {
    const url = `${GnosisService[gnosis.blockchainId]}/v1/safes/${gnosis.address}`
    return lastValueFrom(
      this.httpService.get(url).pipe(
        switchMap(async (res) => {
          if (res.data) {
            const owners = res.data.owners
            gnosis.ownerAddresses = owners.map((owner) => ({ name: '', address: owner, state: 'current' }))
            gnosis.threshold = res.data.threshold
          }
        })
      )
    )
  }

  getChainId(chain: string) {
    switch (chain) {
      case 'ethereum':
        return ETHEREUM_CHAIN_ID
      case 'goerli':
        return GOERLI_CHAIN_ID
      case 'polygon':
        return POLYGON_CHAIN_ID
      case 'bsc':
        return BSC_CHAIN_ID
      default:
        return ETHEREUM_CHAIN_ID
    }
  }
}
