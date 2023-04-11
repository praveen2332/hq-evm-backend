import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsArray, IsEnum, IsEthereumAddress, IsNotEmpty, IsOptional, IsUUID, ValidateIf } from 'class-validator'
import { toChecksumAddress } from 'web3-utils'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { GnosisWalletInfo } from '../common/services/general/gnosis/interfaces'
import { WalletGroup } from '../common/services/wallet-groups/wallet-group.entity'
import { SourceType, WalletBalance, WalletStatusesEnum } from '../common/services/wallets/interfaces'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { PaginationParams } from '../core/interfaces'
import { ToArray } from '../common/decorators/transformers/transformers'

export class WalletGroupDto {
  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'First Group' })
  @IsNotEmpty()
  name: string

  public static map(wallet: WalletGroup): WalletGroupDto {
    const walletGroupDto = new WalletGroupDto()
    walletGroupDto.id = wallet?.publicId
    walletGroupDto.name = wallet?.name
    return walletGroupDto
  }
}

export class WalletDto {
  @ApiProperty({ example: '3461ff8b-b8a7-470e-9d4e-21bf04e653c6' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'New Wallet' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '0xb0c25128707833EAf7B51707d5f2bc31e16FBdd4' })
  address: string

  @ApiProperty({ enum: SourceType, example: SourceType.ETH })
  sourceType: SourceType

  @ApiProperty({ nullable: true, example: '2021-01-01T00:00:00.000Z' })
  flaggedAt: Date

  @ApiProperty()
  group: WalletGroupDto

  @ApiProperty()
  balance: WalletBalance

  @ApiProperty({ enum: WalletStatusesEnum, example: WalletStatusesEnum.SYNCED })
  status: WalletStatusesEnum

  @ApiProperty()
  statusPerChain: {
    [blockchainId: string]: WalletStatusesEnum
  }

  @ApiProperty()
  metadata: GnosisWalletInfo

  @ApiProperty({ example: '2023-02-28T07:58:47.000Z' })
  lastSyncedAt: Date

  public static map(wallet: Wallet): WalletDto {
    const walletDto = new WalletDto()
    walletDto.id = wallet.publicId
    walletDto.name = wallet.name
    walletDto.address = toChecksumAddress(wallet.address)
    walletDto.sourceType = wallet.sourceType
    walletDto.flaggedAt = wallet.flaggedAt
    walletDto.group = WalletGroupDto.map(wallet.walletGroup)
    walletDto.balance = wallet.balance || null
    walletDto.status = wallet.status
    walletDto.statusPerChain = wallet.statusPerChain
    walletDto.metadata = wallet.metadata || null
    walletDto.lastSyncedAt = wallet.lastSyncedAt || null
    return walletDto
  }
}

export class UpdateWalletDto {
  @ApiProperty({ example: 'My Wallet' })
  name: string

  @ApiProperty({ nullable: true, example: true })
  flagged?: boolean

  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsUUID()
  walletGroupId: string
}

export class CreateWalletDto {
  @ApiProperty({ example: 'My Group' })
  name: string

  @IsNotEmpty()
  @IsEthereumAddress()
  @Transform((name) => name.value.toLowerCase())
  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  address: string

  @IsNotEmpty()
  @ApiProperty({ enum: SourceType, example: SourceType.ETH })
  sourceType: SourceType

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  walletGroupId: string

  @ValidateIf((o) => o.sourceType === SourceType.GNOSIS)
  @IsNotEmpty()
  @IsEnum([SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI])
  @ApiProperty({ description: 'Get enum from the publicId of blockchains endpoint' })
  blockchainId: string
}

export class WalletQueryParams extends PaginationParams {
  @IsOptional()
  @IsArray()
  @ToArray()
  @IsEnum(WalletStatusesEnum, { each: true })
  @ApiPropertyOptional({
    isArray: true,
    enum: WalletStatusesEnum,
    example: [WalletStatusesEnum.SYNCED, WalletStatusesEnum.SYNCING]
  })
  statuses: WalletStatusesEnum[]
}
