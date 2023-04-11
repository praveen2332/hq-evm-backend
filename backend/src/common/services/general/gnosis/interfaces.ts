import { SafeOwnerState } from '../../../../source-of-funds/interfaces'

export interface GnosisWalletInfo {
  blockchainId: string
  threshold: number
  ownerAddresses: GnosisOwner[]
}

export interface GnosisOwner {
  name: string
  address: string
  state?: SafeOwnerState
}

export interface GnosisTokenBalance {
  tokenAddress: string | null
  token: {
    name: string
    symbol: string
    decimals: number
    logoUri: string
  } | null
  balance: string
}

export interface GnosisMultisigResponse {
  count: number
  // "https://safe-transaction-goerli.safe.global/api/v1/safes/0xDf77355324B305B1464E3C7d43C2e8c04A2Daa55/multisig-transactions/?limit=100&offset=100"
  next: string
  previous: string
  results: GnosisMultisigTransaction[]
}

export interface GnosisMultisigTransaction {
  // walletId '0xDf77355324B305B1464E3C7d43C2e8c04A2Daa55'
  safe: string
  // '0x2170430E7c8DE0A588E5DA04823E2c6a8c658D2f'
  to: string
  // '7000000000000'
  value: string
  data: unknown
  operation: number
  // '0x0000000000000000000000000000000000000000'
  gasToken: string
  safeTxGas: number
  baseGas: number
  // '0'
  gasPrice: string
  // '0x0000000000000000000000000000000000000000'
  refundReceiver: string
  nonce: 73
  // '2022-12-22T09:44:48Z'
  executionDate: string
  // '2022-12-22T09:44:48Z'
  submissionDate: string
  // '2022-12-22T09:44:48Z'
  modified: string
  // 8179998
  blockNumber: number
  // '0x711160412208b48b6db5691a363edb4a37b800d6ffd1172dac06c9f52424793b'
  transactionHash: string
  // '0xd9bbc4c534f09b1b6651f4e44c16bc4fca1fccf11dae1cc05269e3626e9df517'
  safeTxHash: string
  // '0xE39277704bdcb9D277A77355aaE43FB418A25fF2'
  executor: string
  isExecuted: boolean
  isSuccessful: boolean
  // '1500488128'
  ethGasPrice: string
  // '1500699203'
  maxFeePerGas: string
  // '1500000000'
  maxPriorityFeePerGas: string
  // 70305
  gasUsed: number
  // '105491817839040'
  fee: string
  origin: unknown
  dataDecoded: unknown
  confirmationsRequired: number
  confirmations: GnosisMultisigConfirmation[]
  trusted: boolean
  signatures: string
}

export interface GnosisMultisigConfirmation {
  // '0x2170430E7c8DE0A588E5DA04823E2c6a8c658D2f'
  owner: string
  // '2022-12-22T09:44:48Z'
  submissionDate: string
  transactionHash: string
  // "0x7b946176a80e129e267a5bf2670afa90a40c14ddf62c9734e57703dff70db66f0082d56eeab7a3ab0753999b59df75db552b15c75ee042e427a78f80c881e46920000000000000000000000000e39277704bdcb9d277a77355aae43fb418a25ff2000000000000000000000000000000000000000000000000000000000000000001"
  signature: string
  // ETH_SIGN / APPROVED_HASH
  signatureType: string
}

export interface GnosisSafeInfo {
  address: string
  nonce: number
  threshold: number
  owners: string[]
  masterCopy: string
  modules: []
  fallbackHandler: string
  guard: string
  version: string
}
