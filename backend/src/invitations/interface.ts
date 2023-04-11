import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsEthereumAddress, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator'
import { ERole } from '../roles/interfaces'

export class CreateInvitationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  firstName: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  lastName: string

  @ValidateIf((o) => (o.address ?? null) === null)
  @IsNotEmpty()
  @IsEmail()
  @ApiPropertyOptional()
  email?: string

  @ValidateIf((o) => (o.email ?? null) === null)
  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiPropertyOptional({ example: '0x0000000000000000000000000000000000000000' })
  address?: string

  @ApiProperty({ enum: ERole })
  @IsNotEmpty()
  role: ERole

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @ApiProperty()
  message: string
}

export class ConfirmInvitationDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  firstName: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  lastName: string

  @IsString()
  @IsOptional()
  @ApiProperty()
  contactEmail: string
}

export enum InvitationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}
