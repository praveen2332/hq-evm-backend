import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import Decimal from 'decimal.js'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { Cryptocurrency } from '../common/services/cryptocurrencies/cryptocurrency.entity'
import { TaxLotStatus } from '../common/services/gains-losses/interfaces'
import { TaxLot } from '../common/services/gains-losses/tax-lot.entity'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { PaginationParams } from '../core/interfaces'
import { CryptocurrencyResponseDto } from '../cryptocurrencies/interfaces'

export class AssetResponseDto {
  @IsNotEmpty()
  @ApiProperty({ type: CryptocurrencyResponseDto })
  cryptocurrency: CryptocurrencyResponseDto

  @IsNotEmpty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({
    example: SupportedBlockchains.ETHEREUM_MAINNET,
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainId: string

  @IsNotEmpty()
  @ApiProperty({
    example: '2.123123'
  })
  totalUnits: string

  @IsNotEmpty()
  @ApiProperty({
    example: 'USD'
  })
  fiatCurrency: string

  @IsNotEmpty()
  @ApiProperty({
    example: '1530.27'
  })
  currentFiatPrice: string

  @IsNotEmpty()
  @ApiProperty({
    example: '3299.113'
  })
  totalCurrentFiatValue: string

  @IsNotEmpty()
  @ApiProperty({
    example: '3333.222'
  })
  totalCostBasis: string

  static map(params: ToCreateAssetResponseDto): AssetResponseDto {
    const result = new AssetResponseDto()
    result.cryptocurrency = CryptocurrencyResponseDto.map(params.cryptocurrency)
    result.blockchainId = params.blockchainId
    result.totalUnits = params.totalUnits
    result.fiatCurrency = params.fiatCurrency
    result.totalCostBasis = params.totalCostBasis
    result.currentFiatPrice = params.currentFiatPrice
    result.totalCurrentFiatValue = Decimal.mul(params.totalUnits, params.currentFiatPrice).toString()

    return result
  }
}

export class ToCreateAssetResponseDto {
  cryptocurrency: Cryptocurrency
  blockchainId: string
  fiatCurrency: string
  totalUnits: string
  totalCostBasis: string
  currentFiatPrice: string

  static create(params: {
    cryptocurrency: Cryptocurrency
    blockchainId: string
    fiatCurrency: string
    totalUnits: string
    totalCostBasis: string
    currentFiatPrice: string
  }) {
    const response = new ToCreateAssetResponseDto()
    response.cryptocurrency = params.cryptocurrency
    response.blockchainId = params.blockchainId
    response.fiatCurrency = params.fiatCurrency
    response.totalUnits = params.totalUnits
    response.currentFiatPrice = params.currentFiatPrice
    response.totalCostBasis = Decimal.mul(params.totalUnits, params.currentFiatPrice).toString()

    return response
  }
}

export class AssetQueryParams {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Case-insensitive substring searches on name or symbol of the assets',
    example: 'eth',
    required: false
  })
  nameOrSymbol?: string

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI], { each: true })
  @ApiProperty({
    isArray: true,
    example: [SupportedBlockchains.ETHEREUM_MAINNET],
    description: 'Get enum from the publicId of blockchains endpoint',
    required: false
  })
  blockchainIds?: string[]
}

export class TaxLotQueryParams extends PaginationParams {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsUUID('all', { each: true })
  @ApiProperty({
    isArray: true,
    example: ['9c8f7b01-777f-4a0f-9841-5d7d7e844442', '54a2621d-cbaa-4500-b91a-fb21b5070422'],
    required: false
  })
  walletIds?: string[]

  @IsOptional()
  @IsString()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({ description: 'Get enum from the publicId of blockchains endpoint', required: false })
  blockchainId?: string

  @IsOptional()
  @IsString()
  @IsEnum([TaxLotStatus.AVAILABLE, TaxLotStatus.SOLD])
  @ApiProperty({
    enum: [TaxLotStatus.AVAILABLE, TaxLotStatus.SOLD],
    example: TaxLotStatus.AVAILABLE,
    required: false
  })
  status?: TaxLotStatus
}

export class TaxLotResponseDto {
  @IsNotEmpty()
  @ApiProperty({
    example: '2e5c9628-6356-4d62-8f3f-9fc86ddb2998'
  })
  id: string

  @IsNotEmpty()
  @ApiProperty({ type: CryptocurrencyResponseDto })
  cryptocurrency: CryptocurrencyResponseDto

  @IsNotEmpty()
  @ApiProperty({
    example: '1.5'
  })
  amountTotal: string

  @IsNotEmpty()
  @ApiProperty({
    example: '0.9'
  })
  amountAvailable: string

  @IsNotEmpty()
  @ApiProperty({
    example: TaxLotStatus.AVAILABLE,
    enum: TaxLotStatus
  })
  status: TaxLotStatus

  @IsNotEmpty()
  @ApiProperty({ type: Date, example: '2023-02-28T07:58:47.000Z' })
  purchasedAt: Date

  @IsNotEmpty()
  @ApiProperty({ type: Date, example: '2023-02-28T07:58:47.000Z' })
  updatedAt: Date

  @IsNotEmpty()
  @ApiProperty({ example: '900' })
  costBasisAmount: string

  @IsNotEmpty()
  @ApiProperty({ example: '1000' })
  costBasisPerUnit: string

  @IsNotEmpty()
  @ApiProperty({ example: 'USD' })
  costBasisFiatCurrency: string

  @IsNotEmpty()
  @ApiProperty({ example: '54a2621d-cbaa-4500-b91a-fb21b5070422' })
  walletId: string

  @IsNotEmpty()
  @ApiProperty({ example: 'c055de00-a82a-4e88-8ddb-ccd9371e3abb' })
  organizationId: string

  static map(taxLot: TaxLot, wallets: Wallet[]): TaxLotResponseDto {
    const result = new TaxLotResponseDto()
    result.id = taxLot.publicId
    result.cryptocurrency = CryptocurrencyResponseDto.map(taxLot.cryptocurrency)
    result.amountTotal = taxLot.amountTotal
    result.amountAvailable = taxLot.amountAvailable
    result.status = taxLot.status
    result.purchasedAt = taxLot.purchasedAt
    result.updatedAt = taxLot.updatedAt
    result.costBasisAmount = Decimal.mul(taxLot.amountAvailable, taxLot.costBasisPerUnit).toString()
    result.costBasisPerUnit = taxLot.costBasisPerUnit
    result.costBasisFiatCurrency = taxLot.costBasisFiatCurrency
    result.walletId = wallets.find((wallet) => wallet.id === taxLot.walletId)?.publicId

    return result
  }
}

// export class RevalueBodyParams {
//   @IsNotEmpty()
//   @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
//   revalueAt: Date

//   @IsNotEmpty()
//   @ApiProperty({ example: '5555.1' })
//   newPricePerUnit: string

//   @IsOptional()
//   @IsArray()
//   @ApiProperty({
//     isArray: true,
//     example: [SupportedBlockchains.ETHEREUM_MAINNET],
//     description: 'Get enum from the publicId of blockchains endpoint'
//   })
//   blockchainIds?: string[]
// }

// export class RevalueDto {
//   @IsNotEmpty()
//   @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
//   revalueAt: Date

//   @IsNotEmpty()
//   @ApiProperty({ example: '5555.1' })
//   newPricePerUnit: string
// }

// export class RevalueTaxLotResponseDto {
//   @IsNotEmpty()
//   @ApiProperty({ example: 'hq165935636700087885e122e9e9a26b' })
//   id: string

//   @IsNotEmpty()
//   @ApiProperty({ example: '1' })
//   affectedAmount: string

//   @IsNotEmpty()
//   @ApiProperty({ example: '2000.12' })
//   previousFiatValue: string

//   @IsNotEmpty()
//   @ApiProperty({ example: '3000.13' })
//   newFiatValue: string

//   @IsNotEmpty()
//   @ApiProperty({ example: '1000.01' })
//   unrealisedGainLoss: string

//   static map(params: {
//     publicId: string
//     affectedAmount: string
//     previousFiatValue: string
//     newFiatValue: string
//     unrealisedGainLoss: string
//   }): RevalueTaxLotResponseDto {
//     const result = new RevalueTaxLotResponseDto()

//     result.id = params.publicId
//     result.affectedAmount = params.affectedAmount
//     result.previousFiatValue = params.previousFiatValue
//     result.newFiatValue = params.newFiatValue
//     result.unrealisedGainLoss = params.unrealisedGainLoss

//     return result
//   }
// }

// export class RevalueResponseDto {
//   @IsNotEmpty()
//   @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
//   totalUnrealisedGainLoss: string

//   @IsNotEmpty()
//   @ApiProperty({ type: CryptocurrencyResponseDto })
//   cryptocurrency: CryptocurrencyResponseDto

//   @IsNotEmpty()
//   @ApiProperty({
//     example: 'USD'
//   })
//   fiatCurrency: string

//   @IsOptional()
//   @IsArray()
//   @ApiProperty({ type: RevalueTaxLotResponseDto, isArray: true })
//   RevalueTaxLots?: RevalueTaxLotResponseDto[]

//   static map(params: {
//     cryptocurrency: Cryptocurrency
//     fiatCurrency: string
//     revalueTaxLotResponseDtos: RevalueTaxLotResponseDto[]
//   }): RevalueResponseDto {
//     const result = new RevalueResponseDto()
//     result.cryptocurrency = CryptocurrencyResponseDto.map(params.cryptocurrency)
//     result.totalUnrealisedGainLoss = params.revalueTaxLotResponseDtos
//       ?.reduce((sum, current) => Decimal.add(sum, current.unrealisedGainLoss), new Decimal(0))
//       .toString()
//     result.fiatCurrency = params.fiatCurrency

//     return result
//   }
// }
