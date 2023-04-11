// TODO: refactor this and move to adapter as this should not be here
export interface EtherscanTxListInternalResult {
  readonly blockNumber: string
  readonly timeStamp: string
  readonly from: string
  readonly to: string
  readonly value: string
  readonly contractAddress: string
  readonly input: string
  readonly type: string
  readonly gas: string
  readonly gasUsed: string
  readonly isError: string
  readonly errCode: string
}
