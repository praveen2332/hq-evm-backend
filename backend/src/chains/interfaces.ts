import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CreateChainDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number

  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  isTestNet: boolean
}

export class UpdateChainDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number

  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  isTestNet: boolean
}
