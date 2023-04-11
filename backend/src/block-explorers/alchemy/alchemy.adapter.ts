import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { AssetTransfersCategory, Network, SortingOrder } from 'alchemy-sdk'
import { AssetTransfersWithMetadataResult } from 'alchemy-sdk/dist/src/types/types'
import { BigNumber } from 'ethers'
import { hexToNumber } from 'web3-utils'
import { AddressBalance } from '../types/balance'
import { FeatureMapType } from '../types/feature-key.type'
import { AlchemySyncMetaData } from '../types/sync-meta-data.type'
import { alchemyUtils } from './alchemy.utils'

export class AlchemyAdapter {
  private readonly network: Network

  readonly MAX_BATCH_SIZE = 100

  constructor(private readonly keys: FeatureMapType, blockchainId: string) {
    this.network = alchemyUtils.getNetworkByChainId(blockchainId)
  }

  async getTransactionsByAddress(
    address: string,
    meta: AlchemySyncMetaData,
    validatorFn: (hash: string) => Promise<{ loadInternal: boolean; loadReceipt: boolean }>
  ) {
    const client = alchemyUtils.getAlchemyClient(this.network, this.keys.INGESTION)

    const transfers = await client.core.getAssetTransfers({
      toAddress: meta.direction === 'to' ? address : undefined,
      fromAddress: meta.direction === 'from' ? address : undefined,
      fromBlock: meta.fromBlock || undefined,
      category: [AssetTransfersCategory.ERC20, AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL],
      toBlock: 'latest',
      maxCount: this.MAX_BATCH_SIZE,
      withMetadata: true,
      excludeZeroValue: false,
      pageKey: meta.nextPageId || undefined,
      order: SortingOrder.DESCENDING
    })

    const response: {
      hash: string
      blockNumber: string
      blockTimestamp: string
      receipt: TransactionReceipt
      transfers: AssetTransfersWithMetadataResult[]
      internal?: AssetTransfersWithMetadataResult[]
    }[] = []

    const transactions = this.groupBy(transfers.transfers, (transfer) => transfer.hash)

    for (const hash in transactions) {
      // const transfer = transactions[hash].find((transfer) => transfer.category === AssetTransfersCategory.EXTERNAL)

      // We are getting first event, we need to collect all context as possible
      //TODO: we can optimize that by getting receipt and internal transfers only if we haven't got it before
      const transfer = transactions[hash][0]

      const { loadInternal, loadReceipt } = await validatorFn(transfer.hash)

      let receipt: TransactionReceipt | undefined
      if (transfer && loadReceipt) {
        receipt = await client.core.getTransactionReceipt(transfer.hash)
      }

      //We are getting all internal transfers for address forwarding case.
      //example: https://etherscan.io/tx/0x7f4a9c0551ebaea77dbffdc2750df89bfe90d882b0e96446167a3abecb76b349
      let internal: AssetTransfersWithMetadataResult[] | undefined
      if (transfer && transfer.value !== 0 && loadInternal) {
        internal = await this.getInternalTransactionsByTxHash({
          txHash: transfer.hash,
          blockNumber: transfer.blockNum
        })
      }

      const firstTransfer = transactions[hash][0]

      response.push({
        hash,
        blockNumber: firstTransfer.blockNum,
        blockTimestamp: firstTransfer.metadata.blockTimestamp,
        receipt,
        transfers: transactions[hash],
        internal
      })
    }

    return {
      nextPageId: transfers.pageKey,
      order: SortingOrder.DESCENDING,
      direction: meta.direction,
      lastBlock: this.getLastBlockNumber(transfers.transfers),
      firstBlock: this.getFirstBlockNumber(transfers.transfers),
      response
    }
  }

  groupBy<T, K extends keyof any>(list: T[], getKey: (item: T) => K): Record<K, T[]> {
    return list.reduce((previous, currentItem) => {
      const group = getKey(currentItem)
      if (!previous[group]) {
        previous[group] = []
      }
      previous[group].push(currentItem)
      return previous
    }, {} as Record<K, T[]>)
  }

  getLastBlockNumber(transfers: AssetTransfersWithMetadataResult[]): string | null {
    return transfers.reduce((prev: string, current) => {
      if (!prev) {
        return current.blockNum
      }
      return this.isBiggerNumber(prev, current) ? prev : current.blockNum
    }, null)
  }

  private isBiggerNumber(prev: string, current: AssetTransfersWithMetadataResult) {
    const prevBlock = hexToNumber(prev)
    const currentBlock = hexToNumber(current.blockNum)

    return prevBlock > currentBlock
  }

  getFirstBlockNumber(transfers: AssetTransfersWithMetadataResult[]): string | null {
    return transfers.reduce((prev: string, current) => {
      if (!prev) {
        return current.blockNum
      }
      return this.isBiggerNumber(prev, current) ? current.blockNum : prev
    }, null)
  }

  public async getInternalTransactionsByTxHash(params: {
    txHash: string
    blockNumber: string
  }): Promise<AssetTransfersWithMetadataResult[]> {
    const client = alchemyUtils.getAlchemyClient(this.network, this.keys.INGESTION)

    const transfers = await client.core.getAssetTransfers({
      toBlock: params.blockNumber,
      fromBlock: params.blockNumber,
      category: [AssetTransfersCategory.INTERNAL],
      withMetadata: true,
      excludeZeroValue: true,
      order: SortingOrder.DESCENDING
    })

    return transfers.transfers.filter((transfer) => transfer.hash === params.txHash)
  }

  public async getBalance(address: string): Promise<AddressBalance[]> {
    const client = alchemyUtils.getAlchemyClient(this.network, this.keys.INGESTION)
    const tokenBalances = await client.core.getTokenBalances(address)
    const nativeCoinBalance = await client.core.getBalance(address)

    const balances: AddressBalance[] = []

    //Alchemy returns tokens address even if balance is 0, so we exclude them
    if (!nativeCoinBalance.isZero()) {
      balances.push({
        tokenAddress: null,
        balance: nativeCoinBalance.toString()
      })
    }

    for (const tokenBalance of tokenBalances.tokenBalances) {
      const balance = BigNumber.from(tokenBalance.tokenBalance)

      balances.push({
        tokenAddress: tokenBalance.contractAddress,
        balance: balance.toString()
      })
    }

    return balances
  }
}
