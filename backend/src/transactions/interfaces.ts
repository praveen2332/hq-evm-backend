import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsEthereumAddress, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { PaginationParams } from '../core/interfaces'
import { SourceType } from '../source-of-funds/interfaces'

export enum ETransactionType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  QUEUE = 'queue',
  DRAFT = 'draft'
}

export class TransactionQueryParams extends PaginationParams {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  blockchainId?: string

  @IsOptional()
  @IsEnum(ETransactionType)
  @ApiPropertyOptional({ type: () => ETransactionType, enum: ETransactionType })
  type?: ETransactionType

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  lastDays?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  startTime?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  endTime?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  symbols?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional()
  sourceId?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  categoryIds?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  fromAddress?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  toAddress?: string

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  minRange?: number

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  maxRange?: number
}

export class TransactionExportCSVQueryParams {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  blockchainId?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ type: () => ETransactionType, enum: ETransactionType })
  type?: ETransactionType

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  lastDays?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  startTime?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  endTime?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  symbols?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  sourceId?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  categoryIds?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  minRange?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional()
  maxRange?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  fromAddress?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  toAddress?: string
}

export class CreateTransactionDto {
  id?: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  blockchainId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  hash: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  safeHash: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  comment?: string

  @IsOptional()
  @ApiPropertyOptional()
  tags?: string[]

  @IsOptional()
  @ApiPropertyOptional()
  files?: string[]

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  sourceId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  functionName?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  symbol?: string

  @IsNotEmpty()
  @ApiProperty()
  recipients: TransactionRecipient[]

  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  sourceAddress: string

  @IsNotEmpty()
  @ApiProperty()
  isDraft: boolean

  @IsNotEmpty()
  @ApiProperty({ type: () => SourceType, enum: SourceType })
  type: SourceType

  @IsNotEmpty()
  @ApiProperty()
  categories: string[]

  @IsOptional()
  @ApiPropertyOptional({ type: () => [DraftTransaction] })
  draftTransaction: DraftTransaction[]

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  confirmationsRequired: number
}

export class RecipientPayload {
  @ApiProperty()
  address: string

  @ApiProperty()
  amount: string

  @ApiProperty()
  pastUSDPrice: number
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  comment?: string

  @IsNotEmpty()
  @ApiProperty()
  categories: string[]

  @IsOptional()
  @ApiPropertyOptional()
  files?: string[]

  @IsOptional()
  @ApiPropertyOptional({ type: () => [DraftTransaction] })
  draftTransaction: DraftTransaction[]
}

export class SyncTransactionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  safeHash: string

  @IsOptional()
  @ApiPropertyOptional()
  isExecuted: boolean

  @IsOptional()
  @ApiPropertyOptional()
  hash: string

  @IsNotEmpty()
  @ApiProperty()
  blockchainId: string

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  nonce: number

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  confirmationsRequired: number

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  sourceId: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  symbol: string

  @IsNotEmpty()
  @ApiProperty()
  recipients: TransactionRecipient[]

  @IsNotEmpty()
  @IsString()
  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  sourceAddress: string
}

export interface MetamaskTransaction {
  hash: string
  blockNumber: string
  timeStamp: string
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
  functionName: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
}

export interface FTXTransaction {
  coin: string
  address: string
  tag?: string | null
  fee: number
  id: number
  size: number
  status: EFTXTransactionStatus
  time: string
  method: string
  txid?: string
  notes?: string
}

export interface SafeTransaction {
  baseGas: number
  blockNumber: number
  confirmations: Array<any>
  confirmationsRequired: number
  data: string
  dataDecoded: any
  ethGasPrice: string
  executionDate: string
  executor: string
  fee: string
  gasPrice: string
  gasToken: string
  gasUsed: number
  isExecuted: boolean
  isSuccessful: boolean
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  modified: string
  nonce: number
  operation: number
  origin: string
  refundReceiver: string
  safe: string
  safeTxGas: number
  safeTxHash: string
  signatures: string
  submissionDate: string
  to: string
  transactionHash: string
  trusted: boolean
  value: string
  tokenAddress: string
  tokenInfo: any
  incoming: boolean
  from: string
}

export interface TransactionRecipient {
  address: string
  amount: string
  pastUSDPrice: number
  currentUSDPrice?: number
}

export enum EGnosisSafeMethod {
  TRANSFER = 'transfer',
  MULTISEND = 'multiSend'
}

export enum EFTXTransactionStatus {
  REQUESTED = 'requested',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  CONFIRMED = 'confirmed',
  CANCEL = 'cancelled'
}

export enum EMetamaskMethod {
  TRANSFER = 'transfer',
  DISPERSE_ETHER = 'disperseEther',
  DISPERSE_TOKEN = 'disperseToken'
}

export class DraftTransaction {
  @ApiPropertyOptional()
  address: string

  @ApiPropertyOptional()
  token: string

  @ApiPropertyOptional()
  amount: string
}
