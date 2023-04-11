import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
  IsArray,
  IsDate,
  IsEnum,
  IsEthereumAddress,
  IsInstance,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Validate,
  ValidateIf
} from 'class-validator'
import Decimal from 'decimal.js'
import { toChecksumAddress } from 'web3-utils'
import { CategoryDto } from '../categories/interfaces'
import { ToArray, ToDecimal, ToLowerCase } from '../common/decorators/transformers/transformers'
import { CannotUseWith, MinDecimal } from '../common/decorators/validators/validators'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { ContactDto } from '../common/services/contacts/contact'
import {
  FinancialTransactionChildGnosisMetadata,
  FinancialTransactionGnosisConfirmation
} from '../common/services/financial-transactions/financial-transaction-child-metadata.entity'
import { FinancialTransactionChild } from '../common/services/financial-transactions/financial-transaction-child.entity'
import { FinancialTransactionFile } from '../common/services/financial-transactions/financial-transaction-files.entity'
import { FinancialTransactionParent } from '../common/services/financial-transactions/financial-transaction-parent.entity'
import {
  FinancialTransactionChildMetadataDirection,
  FinancialTransactionChildMetadataNames,
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataSubstatus,
  FinancialTransactionChildMetadataType,
  FinancialTransactionParentActivity,
  FinancialTransactionParentStatus,
  UNCATEGORIZED
} from '../common/services/financial-transactions/interfaces'
import { PaginationParams } from '../core/interfaces'
import { CryptocurrencyResponseDto } from '../cryptocurrencies/interfaces'

export class FinancialTransactionParentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0xa9cfbdeb84d02dbbad3ae6b1d063c5ad85e88e4fa307f4e112f00ff89a9cfac3' })
  hash: string

  @IsNotEmpty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({
    example: SupportedBlockchains.ETHEREUM_MAINNET,
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainId: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: FinancialTransactionParentActivity, example: FinancialTransactionParentActivity.SWAP })
  activity: FinancialTransactionParentActivity

  @IsNotEmpty()
  @ApiProperty({ enum: FinancialTransactionParentStatus, example: FinancialTransactionParentStatus.ACTIVE })
  status: FinancialTransactionParentStatus

  @IsNotEmpty()
  @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
  valueTimestamp: Date

  @IsNotEmpty()
  @ApiProperty({ example: 2 })
  childCount: number

  static map(financialTransactionParent: FinancialTransactionParent): FinancialTransactionParentDto {
    const result = new FinancialTransactionParentDto()
    result.hash = financialTransactionParent.hash
    result.blockchainId = financialTransactionParent.blockchainId
    result.activity = financialTransactionParent.activity
    result.status = financialTransactionParent.status
    result.valueTimestamp = financialTransactionParent.valueTimestamp
    result.childCount = financialTransactionParent.financialTransactionChild?.length ?? 0
    return result
  }
}

export class GnosisMultisigConfirmationDto {
  @ApiProperty({ example: '0x2170430E7c8DE0A588E5DA04823E2c6a8c658D2f' })
  owner: string
  @ApiProperty({ nullable: true })
  ownerContact: ContactDto
  @ApiProperty({ example: '2022-12-22T09:44:48Z' })
  submissionDate: string
  @ApiProperty({ example: '0xa9cfbdeb84d02dbbad3ae6b1d063c5ad85e88e4fa307f4e112f00ff89a9cfac3' })
  transactionHash: string
  @ApiProperty({ example: 'APPROVED_HASH', enum: ['APPROVED_HASH', 'ETH_SIGN'] })
  signatureType: string

  static map(confirmation: FinancialTransactionGnosisConfirmation): GnosisMultisigConfirmationDto {
    const result = new GnosisMultisigConfirmationDto()
    result.owner = confirmation.owner
    result.submissionDate = confirmation.submissionDate
    result.transactionHash = confirmation.transactionHash
    result.signatureType = confirmation.signatureType
    result.ownerContact = null
    return result
  }
}

export class FinancialTransactionGnosisMetadataDto {
  @ApiProperty({ example: '2022-12-22T09:44:48Z' })
  executionDate: string
  @ApiProperty({ example: '2022-12-22T09:44:48Z' })
  submissionDate: string
  @ApiProperty({ example: '2022-12-22T09:44:48Z' })
  modified: string
  @ApiProperty({ example: '0xd9bbc4c534f09b1b6651f4e44c16bc4fca1fccf11dae1cc05269e3626e9df517' })
  safeTxHash: string
  @ApiProperty({ example: 2 })
  confirmationsRequired: number
  @ApiProperty({ isArray: true, type: GnosisMultisigConfirmationDto })
  confirmations: GnosisMultisigConfirmationDto[]

  static map(metadata: FinancialTransactionChildGnosisMetadata): FinancialTransactionGnosisMetadataDto {
    const result = new FinancialTransactionGnosisMetadataDto()
    result.executionDate = metadata.executionDate
    result.submissionDate = metadata.submissionDate
    result.modified = metadata.modified
    result.safeTxHash = metadata.safeTxHash
    result.confirmationsRequired = metadata.confirmationsRequired
    result.confirmations = metadata.confirmations.map((confirmation) => GnosisMultisigConfirmationDto.map(confirmation))
    return result
  }
}

export class FinancialTransactionChildMetadataTypeDto {
  @ApiProperty({ enum: FinancialTransactionChildMetadataType, example: FinancialTransactionChildMetadataType.DEPOSIT })
  value: FinancialTransactionChildMetadataType
  @ApiProperty({ example: FinancialTransactionChildMetadataNames[FinancialTransactionChildMetadataType.DEPOSIT] })
  label: string

  static map(type: FinancialTransactionChildMetadataType): FinancialTransactionChildMetadataTypeDto {
    const result = new FinancialTransactionChildMetadataTypeDto()
    result.value = type
    result.label = FinancialTransactionChildMetadataNames[type] ?? type
    return result
  }
}

export class FinancialTransactionDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'hq167047466300067b8d5bd9bf4941d4' })
  id: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0xa9cfbdeb84d02dbbad3ae6b1d063c5ad85e88e4fa307f4e112f00ff89a9cfac3' })
  hash: string

  @IsNotEmpty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({
    example: SupportedBlockchains.ETHEREUM_MAINNET,
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainId: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: FinancialTransactionChildMetadataType, example: FinancialTransactionChildMetadataType.DEPOSIT })
  type: FinancialTransactionChildMetadataType

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  typeDetail: FinancialTransactionChildMetadataTypeDto

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0xc36442b4a4522e871399cd717abdd847ab11fe88' })
  fromAddress: string

  @IsString()
  @ApiProperty({ nullable: true, example: '0x7078d9efadefcf699c46d6d7bad84e99eb29fd6d' })
  toAddress: string

  @IsString()
  @ApiProperty({ nullable: true, example: '0x7078d9efadefcf699c46d6d7bad84e99eb29fd6d' })
  proxyAddress: string

  @IsNotEmpty()
  @ApiProperty({ type: CryptocurrencyResponseDto })
  cryptocurrency: CryptocurrencyResponseDto

  @IsNotEmpty()
  @ApiProperty({ example: '0.004473765531106052' })
  cryptocurrencyAmount: string

  @IsNotEmpty()
  @IsDate()
  @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
  valueTimestamp: Date

  @IsNotEmpty()
  @ApiProperty({ type: FinancialTransactionParentDto })
  financialTransactionParent: FinancialTransactionParentDto

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    enum: FinancialTransactionChildMetadataStatus,
    example: FinancialTransactionChildMetadataStatus.SYNCED
  })
  status: FinancialTransactionChildMetadataStatus

  @ApiProperty({
    enum: FinancialTransactionChildMetadataSubstatus,
    example: [FinancialTransactionChildMetadataSubstatus.MISSING_COST_BASIS],
    isArray: true
  })
  substatuses: FinancialTransactionChildMetadataSubstatus[]

  @ApiProperty({ nullable: true })
  fromContact: ContactDto

  @ApiProperty({ nullable: true })
  toContact: ContactDto

  @ApiProperty({ nullable: true })
  costBasis: string

  @ApiProperty({ nullable: true })
  fiatAmount: string

  @ApiProperty({ nullable: true })
  fiatAmountPerUnit: string

  @ApiProperty({ nullable: true })
  fiatCurrency: string

  @ApiProperty({ nullable: true })
  gainLoss: string

  @ApiProperty({ nullable: true, example: FinancialTransactionChildMetadataDirection.INCOMING })
  direction: FinancialTransactionChildMetadataDirection

  @ApiProperty({ nullable: true })
  category: CategoryDto

  @ApiProperty({ nullable: true, isArray: true })
  gnosisMetadata: FinancialTransactionGnosisMetadataDto

  @ApiProperty({ nullable: true, example: 'My note' })
  note: string | null

  static map(financialTransactionChild: FinancialTransactionChild, hasParentDto: boolean): FinancialTransactionDto {
    const result = new FinancialTransactionDto()
    result.id = financialTransactionChild.publicId
    result.hash = financialTransactionChild.hash
    result.blockchainId = financialTransactionChild.blockchainId
    result.fromAddress = toChecksumAddress(financialTransactionChild.fromAddress)
    result.toAddress = financialTransactionChild.toAddress
      ? toChecksumAddress(financialTransactionChild.toAddress)
      : null
    result.proxyAddress = financialTransactionChild.proxyAddress
      ? toChecksumAddress(financialTransactionChild.proxyAddress)
      : null
    result.cryptocurrency = CryptocurrencyResponseDto.map(financialTransactionChild.cryptocurrency)
    result.cryptocurrencyAmount = financialTransactionChild.cryptocurrencyAmount
    result.valueTimestamp = financialTransactionChild.valueTimestamp

    const metadata = financialTransactionChild.financialTransactionChildMetadata
    result.type = metadata.type
    result.typeDetail = FinancialTransactionChildMetadataTypeDto.map(metadata.type)
    result.status = metadata.status
    result.substatuses = metadata.substatuses
    result.costBasis = metadata.costBasis
    result.fiatAmount = metadata.fiatAmount
    result.fiatAmountPerUnit = metadata.fiatAmountPerUnit
    result.fiatCurrency = metadata.fiatCurrency
    result.gainLoss = metadata.gainLoss
    result.direction = metadata.direction
    result.note = metadata.note
    result.direction = metadata.direction

    result.category = metadata.category ? CategoryDto.map(metadata.category) : null

    result.financialTransactionParent = hasParentDto
      ? FinancialTransactionParentDto.map(financialTransactionChild.financialTransactionParent)
      : null

    result.fromContact = null
    result.toContact = null

    if (financialTransactionChild.financialTransactionChildMetadata.gnosisMetadata) {
      result.gnosisMetadata = FinancialTransactionGnosisMetadataDto.map(
        financialTransactionChild.financialTransactionChildMetadata.gnosisMetadata
      )
    }

    return result
  }
}

interface FinancialTransactionFilter {
  blockchainIds: string[]
  activities: FinancialTransactionParentActivity[]
  childStatuses: FinancialTransactionChildMetadataStatus[]
  childTypes: FinancialTransactionChildMetadataType[]
  substatuses: FinancialTransactionChildMetadataSubstatus[]
  walletAddresses: string[]
  startTime: string
  endTime: string
  assetIds: string[]
  fromAddresses: string[]
  toAddresses: string[]
  categories: string[]
  fromFiatAmount: Decimal
  toFiatAmount: Decimal
}

export class FinancialTransactionQueryParams extends PaginationParams implements FinancialTransactionFilter {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI], { each: true })
  @ApiProperty({
    isArray: true,
    example: [SupportedBlockchains.ETHEREUM_MAINNET],
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainIds: string[]

  @IsOptional()
  @ToArray()
  @IsEnum(FinancialTransactionParentActivity, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionParentActivity,
    example: [FinancialTransactionParentActivity.SWAP, FinancialTransactionParentActivity.TRANSFER]
  })
  activities: FinancialTransactionParentActivity[]

  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(FinancialTransactionChildMetadataStatus, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataStatus,
    example: [
      FinancialTransactionChildMetadataStatus.SYNCED,
      FinancialTransactionChildMetadataStatus.SYNCING,
      FinancialTransactionChildMetadataStatus.IGNORED
    ]
  })
  childStatuses: FinancialTransactionChildMetadataStatus[]

  @IsOptional()
  @IsArray()
  @ToArray()
  @IsEnum(FinancialTransactionChildMetadataType, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataType,
    example: [FinancialTransactionChildMetadataType.FEE, FinancialTransactionChildMetadataType.DEPOSIT]
  })
  childTypes: FinancialTransactionChildMetadataType[]

  @IsOptional()
  @IsArray()
  @ToArray()
  @IsEnum(FinancialTransactionChildMetadataSubstatus, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataSubstatus,
    example: [
      FinancialTransactionChildMetadataSubstatus.MISSING_COST_BASIS,
      FinancialTransactionChildMetadataSubstatus.MISSING_PRICE
    ]
  })
  substatuses: FinancialTransactionChildMetadataSubstatus[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0', '0xd0c1C91488d4D1913d92EEdd75Ea5913794952be']
  })
  walletAddresses: string[]

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  @ApiPropertyOptional({ example: '2022-01-01' })
  startTime: string

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  @ApiPropertyOptional({ example: '2023-01-01' })
  endTime: string

  @IsArray()
  @IsOptional()
  @ToArray()
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad', 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad']
  })
  assetIds: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0xd0c1C91488d4D1913d92EEdd75Ea5913794952be', '0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0']
  })
  fromAddresses: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0xd0c1C91488d4D1913d92EEdd75Ea5913794952be', '0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0']
  })
  toAddresses: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ApiPropertyOptional({
    isArray: true,
    example: [UNCATEGORIZED, 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad']
  })
  categories: string[]

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @ApiPropertyOptional({ example: '10.72', type: String })
  fromFiatAmount: Decimal

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @ApiPropertyOptional({ example: '32.72', type: String })
  toFiatAmount: Decimal
}

export class FinancialTransactionQueryExportParams implements FinancialTransactionFilter {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI], { each: true })
  @ApiProperty({
    isArray: true,
    example: [SupportedBlockchains.ETHEREUM_MAINNET],
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainIds: string[]

  @IsOptional()
  @ToArray()
  @IsEnum(FinancialTransactionParentActivity, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionParentActivity,
    example: [FinancialTransactionParentActivity.SWAP, FinancialTransactionParentActivity.TRANSFER]
  })
  activities: FinancialTransactionParentActivity[]

  @IsOptional()
  @ToArray()
  @IsArray()
  @IsEnum(FinancialTransactionChildMetadataStatus, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataStatus,
    example: [
      FinancialTransactionChildMetadataStatus.SYNCED,
      FinancialTransactionChildMetadataStatus.SYNCING,
      FinancialTransactionChildMetadataStatus.IGNORED
    ]
  })
  childStatuses: FinancialTransactionChildMetadataStatus[]

  @IsOptional()
  @IsArray()
  @ToArray()
  @IsEnum(FinancialTransactionChildMetadataType, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataType,
    example: [FinancialTransactionChildMetadataType.FEE, FinancialTransactionChildMetadataType.DEPOSIT]
  })
  childTypes: FinancialTransactionChildMetadataType[]

  @IsOptional()
  @IsArray()
  @ToArray()
  @IsEnum(FinancialTransactionChildMetadataSubstatus, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: FinancialTransactionChildMetadataSubstatus,
    example: [
      FinancialTransactionChildMetadataSubstatus.MISSING_COST_BASIS,
      FinancialTransactionChildMetadataSubstatus.MISSING_PRICE
    ]
  })
  substatuses: FinancialTransactionChildMetadataSubstatus[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0', '0xd0c1C91488d4D1913d92EEdd75Ea5913794952be']
  })
  walletAddresses: string[]

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  @ApiPropertyOptional({ example: '2022-01-01' })
  startTime: string

  @IsOptional()
  @IsString()
  @IsISO8601({ strict: true })
  @ApiPropertyOptional({ example: '2023-01-01' })
  endTime: string

  @IsArray()
  @IsOptional()
  @ToArray()
  @IsUUID('all', { each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad', 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad']
  })
  assetIds: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0xd0c1C91488d4D1913d92EEdd75Ea5913794952be', '0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0']
  })
  fromAddresses: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ToLowerCase()
  @IsEthereumAddress({ each: true })
  @ApiPropertyOptional({
    isArray: true,
    example: ['0xd0c1C91488d4D1913d92EEdd75Ea5913794952be', '0x3fE465eDc3A17D1e37c2763Ad9A21526Ce09c2B0']
  })
  toAddresses: string[]

  @IsArray()
  @IsOptional()
  @ToArray()
  @ApiPropertyOptional({
    isArray: true,
    example: [UNCATEGORIZED, 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad']
  })
  categories: string[]

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @ApiPropertyOptional({ example: '10.72', type: String })
  fromFiatAmount: Decimal

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @ApiPropertyOptional({ example: '32.72', type: String })
  toFiatAmount: Decimal
}

export class FinancialTransactionParentDetailDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0xa9cfbdeb84d02dbbad3ae6b1d063c5ad85e88e4fa307f4e112f00ff89a9cfac3' })
  hash: string

  @IsNotEmpty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({
    example: SupportedBlockchains.ETHEREUM_MAINNET,
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainId: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: FinancialTransactionParentActivity, example: FinancialTransactionParentActivity.SWAP })
  activity: FinancialTransactionParentActivity

  @IsNotEmpty()
  @ApiProperty({ enum: FinancialTransactionParentStatus, example: FinancialTransactionParentStatus.ACTIVE })
  status: FinancialTransactionParentStatus

  @IsNotEmpty()
  @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
  valueTimestamp: Date

  @IsNotEmpty()
  @ApiProperty({ isArray: true, type: FinancialTransactionDto })
  financialTransactions: FinancialTransactionDto[]

  static map(financialTransactionParent: FinancialTransactionParent): FinancialTransactionParentDetailDto {
    const result = new FinancialTransactionParentDetailDto()
    result.hash = financialTransactionParent.hash
    result.blockchainId = financialTransactionParent.blockchainId
    result.activity = financialTransactionParent.activity
    result.status = financialTransactionParent.status
    result.valueTimestamp = financialTransactionParent.valueTimestamp
    result.financialTransactions = []
    for (const child of financialTransactionParent.financialTransactionChild) {
      result.financialTransactions.push(FinancialTransactionDto.map(child, false))
    }

    return result
  }
}

export class FinancialTransactionUpdateDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  // Category can be null, we should erase the category in this case
  @ValidateIf((object, value) => value !== null)
  @ApiPropertyOptional({ example: 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad' })
  categoryId: string | null

  // @IsOptional()
  // @IsString()
  // @IsIn([FinancialTransactionChildMetadataStatus.IGNORED, FinancialTransactionChildMetadataStatus.SYNCED])
  // @ApiPropertyOptional({
  //   example: 'ignored',
  //   enum: [FinancialTransactionChildMetadataStatus.IGNORED, FinancialTransactionChildMetadataStatus.SYNCED]
  // })
  // status: FinancialTransactionChildMetadataStatus

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @Validate(CannotUseWith, ['unitAmount'])
  @Validate(Min, [0])
  @ApiPropertyOptional({ example: '32.72', type: String })
  amount: Decimal

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @Validate(CannotUseWith, ['amount'])
  @ApiPropertyOptional({ example: '1.26', type: String })
  amountPerUnit: Decimal

  @IsOptional()
  @IsInstance(Decimal)
  @MinDecimal(0)
  @ToDecimal()
  @ApiPropertyOptional({ example: '3.26', type: String })
  costBasis: Decimal

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Please leave comment' })
  note: string | null
}

export class FinancialTransactionFileDto {
  @ApiProperty({ example: 'a9cfbdeb-84d0-2dbb-ad3a-e6b1d063c5ad' })
  id: string
  @ApiProperty({ example: 'filename.csv' })
  name: string

  @ApiProperty({ example: 6666 })
  size: number
  @ApiProperty({ example: 'text/csv' })
  mimeType: string

  static map(file: FinancialTransactionFile): FinancialTransactionFileDto {
    const result = new FinancialTransactionFileDto()
    result.id = file.publicId
    result.name = file.name
    result.size = file.size
    result.mimeType = file.mimeType
    return result
  }
}
