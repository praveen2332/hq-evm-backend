export interface MetamaskResponse<T> {
  status: string
  message: string
  result: T[]
}

export interface SafeResponse<T> {
  next: string | null
  results: T[]
}

export interface TransactionDto {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  isError: string
  txreceipt_status: string
  input: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  confirmations: string
  decodedInput: any
  method: string
}
