import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEthereumAddress, IsNotEmpty } from 'class-validator'
import { SourceGnosis } from './source-gnosis/source-gnosis.entity'

export enum SafeOwnerState {
  CURRENT = 'current',
  NEW = 'new',
  OLD = 'old',
  REMOVING = 'removing'
}

export interface IGnosisSource extends SourceGnosis {
  name: string
}

export class CreateSourceEthDto {
  id?: string

  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  organizationId: string

  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string

  @IsNotEmpty()
  @ApiProperty()
  blockchainId: string
}

export class CreateSourceCoinbaseDto {
  id?: string

  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  organizationId: string

  @IsNotEmpty()
  @ApiProperty()
  accessToken: string

  @IsNotEmpty()
  @ApiProperty()
  refreshToken: string

  @IsNotEmpty()
  @ApiProperty()
  expiryDate: Date
}

export class CreateSourceCdcDto {
  id?: string

  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  organizationId: string

  @IsNotEmpty()
  @ApiProperty()
  apiKey: string

  @IsNotEmpty()
  @ApiProperty()
  secretKey: string
}

export class CreateSourceFtxDto {
  id?: string

  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  apiKey: string

  @IsNotEmpty()
  @ApiProperty()
  secretKey: string

  @ApiProperty({ nullable: true })
  subAccountName: string
}

export class CreateSourceGnosisDto {
  id?: string

  @ApiProperty()
  name: string

  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string

  @IsNotEmpty()
  @ApiProperty()
  blockchainId: string

  @IsNotEmpty()
  @ApiProperty()
  organizationId: string

  @IsNotEmpty()
  @ApiProperty()
  threshold: number

  @IsNotEmpty()
  @ApiProperty({ type: () => [SafeOwner] })
  ownerAddresses: SafeOwner[]
}

export class CreateSourceDto {
  id?: string

  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  organizationId: string

  @IsNotEmpty()
  @ApiProperty()
  apiKey: string

  @IsNotEmpty()
  @ApiProperty()
  secretKey: string

  @IsNotEmpty()
  @ApiProperty()
  limitTransfer: string
}

export class WithdrawHistoryParams {
  @ApiProperty({ nullable: true })
  start_time?: number

  @ApiProperty({ nullable: true })
  end_time?: number
}

export class WithdrawFeeFTXDto {
  @IsNotEmpty()
  @ApiProperty()
  coin: string

  @IsNotEmpty()
  @ApiProperty()
  size: number

  @IsNotEmpty()
  @ApiProperty()
  address: string

  @ApiProperty({ nullable: true })
  tag?: string

  @ApiProperty({ nullable: true })
  method?: string
}

export class WithdrawFTXDto extends WithdrawFeeFTXDto {
  @ApiProperty({ nullable: true })
  password?: string

  @ApiProperty({ nullable: true })
  code?: string

  @ApiProperty({ nullable: true })
  protocol?: string
}

export class UpdateSourceDto {
  @ApiProperty()
  name: string

  @ApiProperty({ nullable: true })
  disabled?: boolean
}

export enum SourceType {
  FTX = 'FTX',
  GNOSIS = 'Gnosis',
  COINBASE = 'Coinbase',
  CDC = 'CDC',
  ETH = 'ETH'
}

export interface TokenBalance {
  id: string
  name: string
  balance: string
  usd: number
  decimals: number
}

export interface ChainSync {
  lastSyncAt: Date
  lastSyncBlock: string
}

export interface SourceBalance {
  [n: string]: TokenBalance[]
}

export interface SourceLastSync {
  [n: string]: ChainSync
}

export interface VaultResponse<T> {
  request_id: string
  data: T
  auth?: T
}

export interface SourceFtxKey {
  apiKey: string
  secretKey: string
  subAccountName?: string
}

export interface VaultSecretId {
  secret_id: string
}

export class SafeOwner {
  @ApiProperty()
  name: string

  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string

  @ApiPropertyOptional({ enum: SafeOwnerState, default: SafeOwnerState.CURRENT })
  state?: string
}

export interface VaultToken {
  client_token: string
}

export interface FtxBalance {
  coin: string
  free: number
  spotBorrow: number
  total: number
  usdValue: number
  availableWithoutBorrow: number
  availableForWithdrawal: number
}
