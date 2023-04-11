import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { SourceEth } from '../../../source-of-funds/source-eth-eoa/source-eth-eoa.entity'
import { SourceGnosis } from '../../../source-of-funds/source-gnosis/source-gnosis.entity'
import { SourceOfFund } from '../../../source-of-funds/source-of-fund.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { Member } from '../members/member.entity'
import { Wallet } from '../wallets/wallet.entity'
import { Recipient } from './recipient.entity'

export enum ContactTypeEnum {
  SOURCE_OF_FUNDS = 'source_of_funds',
  WALLET = 'wallet',
  MEMBER = 'member',
  CONTACT = 'contact'
}

export class ContactDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'e337bfa6-d26c-422c-acc6-290da8342038' })
  organizationId: string //public id

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'John Doe' })
  name: string

  @IsNotEmpty()
  @ApiProperty({ example: ContactTypeEnum.CONTACT, enum: ContactTypeEnum })
  type: ContactTypeEnum

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '1' })
  typeId: string

  @ApiProperty({ isArray: true, type: () => AddressDto })
  addresses: AddressDto[]

  static mapFromRecipient(recipient: Recipient): ContactDto {
    const contact = new ContactDto()
    contact.organizationId = recipient.organization.publicId
    contact.name = recipient.organizationName ? recipient.organizationName : recipient.contactName
    contact.type = ContactTypeEnum.CONTACT
    contact.typeId = recipient.id
    contact.addresses = recipient.recipientAddresses.map((address) =>
      AddressDto.map(address.address, address.blockchainId)
    )
    return contact
  }

  static mapFromMember(member: Member): ContactDto {
    const contact = new ContactDto()
    contact.organizationId = member.organization.publicId
    contact.name = `${member.account.firstName} ${member.account.lastName}`
    contact.type = ContactTypeEnum.MEMBER
    contact.typeId = member.id
    contact.addresses = member.profile.addresses.map((address) => AddressDto.map(address.address, address.blockchainId))
    return contact
  }

  static mapFromSourceOfFund(wallet: SourceEth | SourceGnosis, sof: SourceOfFund): ContactDto {
    const contact = new ContactDto()
    contact.organizationId = sof.organization.publicId
    contact.name = sof.name
    contact.type = ContactTypeEnum.SOURCE_OF_FUNDS
    contact.typeId = sof.id
    contact.addresses = [AddressDto.map(wallet.address, wallet.blockchainId)]
    return contact
  }

  static mapFromWallet(wallet: Wallet): ContactDto {
    const contact = new ContactDto()
    contact.organizationId = wallet.organization.publicId
    contact.name = wallet.name
    contact.type = ContactTypeEnum.WALLET
    contact.typeId = wallet.publicId
    contact.addresses = [AddressDto.map(wallet.address, wallet.metadata?.blockchainId)]
    return contact
  }
}

export class AddressDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '0xe717991E74a2173D32d01F24984C2244c7fcD770' })
  address: string

  @IsNotEmpty()
  @ApiProperty({ example: 'ethereum' })
  blockchainId: string

  @IsOptional()
  @ApiProperty()
  cryptoCurrency: {
    name: string
    symbol: string
  }

  static map(address: string, blockchainId: string, cryptoCurrency?: Cryptocurrency): AddressDto {
    const addressDto = new AddressDto()
    addressDto.address = address
    addressDto.blockchainId = blockchainId
    if (cryptoCurrency) {
      addressDto.cryptoCurrency = {
        name: cryptoCurrency.name,
        symbol: cryptoCurrency.symbol
      }
    }
    return addressDto
  }
}
