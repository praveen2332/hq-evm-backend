import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CreateTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number

  @ApiProperty()
  @IsNotEmpty()
  name: string
}

export class UpdateTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  id: number

  @ApiProperty()
  @IsNotEmpty()
  name: string
}
