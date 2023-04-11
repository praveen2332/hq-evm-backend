import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested
} from 'class-validator'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { PaginationParams } from '../core/interfaces'

export enum ERecipientType {
  INDIVIDUAL = 'individual',
  ORGANIZATION = 'organization'
}

export class RecipientQuery extends PaginationParams {
  @ApiPropertyOptional({ enum: ERecipientType })
  @IsOptional()
  @IsString()
  type: ERecipientType
}

export class CreateRecipientDto {
  @ApiProperty()
  @ValidateIf((o) => o.type === ERecipientType.ORGANIZATION)
  @IsNotEmpty()
  organizationName: string

  @ApiProperty()
  @ValidateIf((o) => o.type === ERecipientType.ORGANIZATION)
  @IsNotEmpty()
  organizationAddress: string

  @ApiProperty({ enum: ERecipientType })
  @IsNotEmpty()
  type: ERecipientType

  @ApiProperty()
  @ValidateIf((o) => o.type === ERecipientType.INDIVIDUAL)
  @IsNotEmpty()
  contactName: string

  @ApiProperty({ type: () => [RecipientAddress] })
  @IsArray()
  @ValidateNested()
  @Type(() => RecipientAddress)
  @ArrayMinSize(1)
  wallets: RecipientAddress[]

  @ApiProperty({ type: () => [RecipientContact] })
  @IsArray()
  contacts: RecipientContact[]
}

export class RecipientAddress {
  @ApiProperty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  blockchainId: string

  @IsNotEmpty()
  @ApiProperty({ example: 'USDT' })
  cryptocurrencySymbol: string

  @ApiProperty()
  address: string
}

export class RecipientContact {
  @ApiProperty()
  providerId: string

  @ApiProperty()
  content: string
}
