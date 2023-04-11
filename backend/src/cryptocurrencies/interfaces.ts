import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { toChecksumAddress } from 'web3-utils'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { CryptocurrencyAddress } from '../common/services/cryptocurrencies/cryptocurrency-address.entity'
import { Cryptocurrency, CryptocurrencyImage } from '../common/services/cryptocurrencies/cryptocurrency.entity'
import { CryptocurrencyType } from '../common/services/cryptocurrencies/interfaces'

export class CryptocurrencyResponseDto {
  @ApiProperty({ example: 'USD Coin' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '0ef47d42-10bf-4404-88f4-f7a7f57fa923' })
  @IsNotEmpty()
  publicId: string

  @ApiProperty({ example: 'USDC' })
  @IsNotEmpty()
  symbol: string

  @ApiProperty({
    example: {
      thumb:
        'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/cryptocurrency-images/USDC_usd-coin_7eb722d7-e986-405e-a01c-b018bc710593_thumb.png',
      small:
        'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/cryptocurrency-images/USDC_usd-coin_7eb722d7-e986-405e-a01c-b018bc710593_small.png',
      large:
        'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/cryptocurrency-images/USDC_usd-coin_7eb722d7-e986-405e-a01c-b018bc710593_large.png'
    }
  })
  @IsNotEmpty()
  image: CryptocurrencyImage

  @ApiProperty({ isArray: true, type: () => CryptocurrencyAddressResponseDto })
  @IsNotEmpty()
  addresses: CryptocurrencyAddressResponseDto[]

  @ApiProperty({ example: true })
  @IsNotEmpty()
  isVerified: boolean

  static map(cryptocurrency: Cryptocurrency): CryptocurrencyResponseDto {
    const result = new CryptocurrencyResponseDto()
    result.name = cryptocurrency.name
    result.publicId = cryptocurrency.publicId
    result.symbol = cryptocurrency.symbol
    result.image = cryptocurrency.image
    result.isVerified = cryptocurrency.isVerified
    if (cryptocurrency.addresses) {
      result.addresses = cryptocurrency.addresses.map((address) => CryptocurrencyAddressResponseDto.map(address))
    }
    return result
  }
}

export class CryptocurrencyAddressResponseDto {
  @ApiProperty({ example: 1 })
  blockchainId: string

  @ApiProperty({ example: CryptocurrencyType.TOKEN, enum: CryptocurrencyType })
  type: CryptocurrencyType

  @ApiProperty({
    example: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  })
  @IsOptional()
  address: string

  @ApiProperty({ example: 6 })
  @IsNotEmpty()
  decimal: number

  static map(cryptocurrencyAddress: CryptocurrencyAddress): CryptocurrencyAddressResponseDto {
    const result = new CryptocurrencyAddressResponseDto()
    result.blockchainId = cryptocurrencyAddress.blockchainId
    result.type = cryptocurrencyAddress.type
    result.decimal = cryptocurrencyAddress.decimal
    result.address = cryptocurrencyAddress.address ? toChecksumAddress(cryptocurrencyAddress.address) : null
    return result
  }
}

export class CryptocurrenciesByWalletIdsQueryParams {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsString({ each: true })
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI], { each: true })
  @ApiProperty({
    isArray: true,
    example: [SupportedBlockchains.ETHEREUM_MAINNET],
    description: 'Get enum from the publicId of blockchains endpoint'
  })
  blockchainIds?: string[]

  @IsNotEmpty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsUUID('all', { each: true })
  @ApiProperty({ isArray: true, enum: ['e24d4f28-e741-41e7-a4fb-3b295d925353'] })
  walletIds?: string[]
}
