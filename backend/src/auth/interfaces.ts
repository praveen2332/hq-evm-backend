import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class LoginAuthDto {
  @ApiProperty()
  token: string

  @ApiProperty()
  address: string

  @ApiProperty()
  signature: string

  @ApiProperty()
  @IsNotEmpty()
  provider: EProvider
}

export class SignUpAuthDto extends LoginAuthDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string
}

export class RefreshDto {
  @ApiProperty()
  @IsNotEmpty()
  refreshToken: string
}

export enum EProvider {
  EMAIL = 'email',
  TWITTER = 'twitter',
  WALLET = 'wallet'
}

export interface JwtPayload {
  verifierId: string
  authId: string
  accountId: string
  address: string
  walletId: string
  provider: string
  organizationId?: string
  roles?: string[]
  iat?: number
  exp?: number
}
