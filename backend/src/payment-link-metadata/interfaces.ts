import { ApiProperty } from '@nestjs/swagger'
import { IsEthereumAddress, IsNotEmpty, IsOptional } from 'class-validator'

export class CreatePaymentLinkMetadataDto {
  @ApiProperty({ example: '0x224bb2dcacb64b784bf066a1b7babd1887e8be341692f6e7625cc929eb24401d' })
  @IsNotEmpty()
  hash: string

  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsNotEmpty()
  @IsEthereumAddress()
  fromAddress: string

  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsNotEmpty()
  @IsEthereumAddress()
  toAddress: string

  @ApiProperty({ example: 'INV-00000' })
  @IsOptional()
  invoice: string

  @ApiProperty({ example: 'Some text, maybe even json... I do not care' })
  @IsOptional()
  remarks: string

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  @IsNotEmpty()
  paymentLinkId: string

  @ApiProperty()
  @IsNotEmpty()
  completedAt: Date

  @IsOptional()
  @ApiProperty()
  contactDetails

  @IsOptional()
  @ApiProperty({ example: '0.012' })
  cryptocurrencyAmount: string

  @IsOptional()
  @ApiProperty({ example: 'ETH' })
  cryptocurrencySymbol: string

  @IsOptional()
  @ApiProperty({ example: '36.5' })
  fiatValue: string
}
