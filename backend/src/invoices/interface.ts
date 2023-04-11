import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested
} from 'class-validator'

export class Address {
  @ApiProperty()
  address1: string

  @ApiProperty()
  address2: string

  @ApiProperty()
  district: string

  @ApiProperty()
  city: string

  @ApiProperty()
  postCode: string

  @ApiProperty()
  country: string
}

export class Detail {
  @ApiProperty()
  companyId: string

  @ApiProperty()
  taxId: string

  @ApiProperty()
  email: string

  @ApiProperty()
  phone: string
}

export class InvoicePerson {
  @IsNotEmpty()
  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  contactName?: string

  @ApiPropertyOptional({ type: () => Address })
  address?: Address

  @ApiPropertyOptional({ type: () => Detail })
  detail?: Detail
}

export class Item {
  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  units: number

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  price: number

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  type: string
}

export class CreateInvoiceDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => InvoicePerson)
  @ApiProperty({ type: () => InvoicePerson })
  from: InvoicePerson

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => InvoicePerson)
  @ApiProperty({ type: () => InvoicePerson })
  to: InvoicePerson

  @IsArray()
  @MinLength(1)
  @ValidateNested()
  @Type(() => Item)
  @ApiProperty({ type: () => Item })
  items: Item[]

  @IsOptional()
  @ApiPropertyOptional()
  information: string

  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  recipient: string

  @IsNotEmpty()
  @ApiProperty()
  network: string
}
