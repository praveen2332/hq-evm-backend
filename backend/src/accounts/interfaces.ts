import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional } from 'class-validator'

export enum AccountRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export class CreateAccountDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string
}

export class UpdateAccountDto {
  @ApiProperty()
  @IsOptional()
  image: string

  @ApiProperty()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsNotEmpty()
  lastName: string
}
