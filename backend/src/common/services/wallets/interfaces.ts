import { CryptocurrencyResponseDto } from '../../../cryptocurrencies/interfaces'

export enum WalletStatusesEnum {
  SYNCING = 'syncing',
  SYNCED = 'synced',
  FAILED = 'failed'
}

export interface WalletBalance {
  lastSyncedAt: Date
  blockchains: WalletBalancePerBlockchain
}

export interface WalletStatusPerChain {
  [blockchainId: string]: WalletStatusesEnum
}

export interface WalletBalancePerBlockchain {
  [blockchainId: string]: TokenBalance[]
}
export interface TokenBalance {
  cryptocurrency: CryptocurrencyResponseDto
  cryptocurrencyAmount: string
  fiatCurrency: string
  fiatAmount: string
}

export enum SourceType {
  GNOSIS = 'gnosis',
  ETH = 'eth'
}
