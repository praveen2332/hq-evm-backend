import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class GetContactsParams {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ enum: [1, 5] })
  blockchainId: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  nameOrAddress: string
}
