import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CreateGroupDto {
  id?: string

  @IsNotEmpty()
  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  description?: string

  organizationId?: string
}

export class UpdateGroupDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  description?: string

  organizationId?: string
}
