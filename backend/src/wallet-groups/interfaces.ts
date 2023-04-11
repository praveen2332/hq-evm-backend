import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { WalletGroup } from '../common/services/wallet-groups/wallet-group.entity'
import { SourceType } from '../common/services/wallets/interfaces'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { toChecksumAddress } from 'web3-utils'

export class WalletGroupDto {
  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'First Group' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 2 })
  walletsSize: number

  public static map(wallet: WalletGroup): WalletGroupDto {
    const walletGroupDto = new WalletGroupDto()
    walletGroupDto.id = wallet?.publicId
    walletGroupDto.name = wallet?.name
    walletGroupDto.walletsSize = wallet?.wallets?.length || 0
    return walletGroupDto
  }
}

export class UpdateWalletGroupDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'First Group' })
  name: string
}

export class CreateWalletGroupDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'First Group' })
  name: string
}

export class WalletGroupListDto {
  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'First Group' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 2 })
  walletsSize: number

  @ApiProperty({
    isArray: true,
    type: () => WalletListDto
  })
  wallets: WalletListDto[]

  public static map(walletGroup: WalletGroup): WalletGroupListDto {
    const walletGroupDto = new WalletGroupListDto()
    walletGroupDto.id = walletGroup.publicId
    walletGroupDto.name = walletGroup.name
    walletGroupDto.walletsSize = walletGroup.wallets?.length || 0
    walletGroupDto.wallets = walletGroup.wallets?.map((wallet) => WalletListDto.map(wallet)) || []
    return walletGroupDto
  }
}

export class WalletListDto {
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

  public static map(wallet: Wallet): WalletListDto {
    const walletDto = new WalletListDto()
    walletDto.id = wallet.publicId
    walletDto.name = wallet.name
    walletDto.address = toChecksumAddress(wallet.address)
    walletDto.sourceType = wallet.sourceType
    return walletDto
  }
}
