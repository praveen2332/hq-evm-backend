import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsEthereumAddress } from 'class-validator'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { PaymentLink } from '../common/services/payment-links/payment-link.entity'

export class CreatePaymentLinkDto {
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({ example: SupportedBlockchains.ETHEREUM_MAINNET })
  blockchainId: string

  @ApiProperty({ example: 'ETH', type: String })
  cryptocurrency: string

  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string
}

export class PaymentLinkDto {
  @ApiProperty({ example: 'a8ae155f-3b4d-4e86-99eb-bbf0af20837b' })
  publicId: string

  @ApiProperty({ example: 'b59011a5-0a28-4d88-97f6-89b361cecdb6' })
  organizationId: string

  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string

  @ApiProperty({ example: SupportedBlockchains.ETHEREUM_MAINNET })
  blockchainId: string

  @ApiProperty({ example: 'ETH', type: String })
  cryptocurrency: string

  constructor(params: {
    publicId: string
    organizationId: string
    address: string
    blockchainId: string
    cryptocurrency: string
  }) {
    this.publicId = params.publicId
    this.organizationId = params.organizationId
    this.address = params.address
    this.blockchainId = params.blockchainId
    this.cryptocurrency = params.cryptocurrency
  }

  static map(paymentLink: PaymentLink): PaymentLinkDto {
    return new PaymentLinkDto({
      publicId: paymentLink.publicId,
      organizationId: paymentLink.organization?.publicId,
      address: paymentLink.address,
      blockchainId: paymentLink.blockchainId,
      cryptocurrency: paymentLink.cryptocurrency?.symbol
    })
  }
}
