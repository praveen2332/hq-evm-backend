import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {IsEthereumAddress, IsNotEmpty, IsString} from 'class-validator'

export class CreateWalletDto {
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsEthereumAddress()
  address: string

  @ApiPropertyOptional()
  name?: string

  @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  firstName: string

  @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  lastName: string
}

export class UpdateWalletDto {
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  @IsEthereumAddress()
  address: string

  @ApiProperty()
  @IsNotEmpty()
  name: string
}
