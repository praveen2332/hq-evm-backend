import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsEnum, IsEthereumAddress, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { MemberAddress } from '../common/services/members/addresses/address.entity'
import { MemberContact } from '../common/services/members/contacts/member-contact.entity'
import { Member } from '../common/services/members/member.entity'
import { PaginationParams } from '../core/interfaces'
import { ERole } from '../roles/interfaces'
import { Type } from 'class-transformer'

export class MemberDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  organizationId: string

  @ApiProperty()
  accountName: string

  @ApiProperty()
  authName: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  accountImage: string | null

  @ApiProperty()
  role: ERole

  @ApiProperty()
  createdAt: Date

  constructor(params: {
    account: {
      name: string
      authName: string
      firstName: string
      lastName: string
      image: string
    }
    role: {
      name: ERole
    }
    createdAt: Date
    organizationId: string
    id: string
  }) {
    this.accountName = params.account.name
    this.authName = params.account.authName
    this.firstName = params.account.firstName
    this.lastName = params.account.lastName
    this.accountImage = params.account.image
    this.role = params.role.name
    this.createdAt = params.createdAt
    this.id = params.id
    this.organizationId = params.organizationId
  }

  public static map(member: Member) {
    const authWallet = member?.account?.walletAccounts[0]
    const authEmail = member?.account?.emailAccounts[0]

    return new MemberDto({
      account: {
        name: member.account?.name ?? null,
        image: member.account.image ?? null,
        firstName: member.account?.firstName ?? null,
        lastName: member.account?.lastName ?? null,
        authName: authEmail?.email ?? authWallet?.address ?? null
      },
      role: {
        name: member.role.name
      },
      createdAt: member.createdAt,
      organizationId: member.organization.publicId,
      id: member.publicId
    })
  }
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ERole, example: ERole.Admin })
  @IsNotEmpty()
  @IsEnum(ERole)
  role: ERole
}

export enum MemberState {
  active = 'active',
  deactivated = 'deactivated'
}

export class MemberQueryParams extends PaginationParams {
  @ApiPropertyOptional({ enum: MemberState, example: MemberState.deactivated })
  @IsEnum(MemberState)
  state: MemberState = MemberState.active
}

export class ProfileDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  organizationId: string

  @ApiProperty()
  role: ERole

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  addresses: AddressDto[]

  @ApiProperty()
  contacts: ContactDto[]

  constructor(params: {
    role: {
      name: ERole
    }
    account: {
      firstName: string
      lastName: string
    }
    profile: {
      addresses: AddressDto[]
      contacts: ContactDto[]
    }
    createdAt: Date
    organizationId: string
    id: string
  }) {
    this.role = params.role.name
    this.firstName = params.account.firstName
    this.lastName = params.account.lastName
    this.createdAt = params.createdAt
    this.id = params.id
    this.organizationId = params.organizationId
    this.addresses = params.profile.addresses ?? []
    this.contacts = params.profile.contacts ?? []
  }

  public static map(member: Member) {
    return new ProfileDto({
      role: {
        name: member.role.name
      },
      account: {
        firstName: member.account.firstName,
        lastName: member.account.lastName
      },
      profile: {
        addresses: member.profile.addresses.map((a) => AddressDto.map(a)),
        contacts: member?.profile?.contacts?.map((c) => ContactDto.map(c))
      },
      createdAt: member.createdAt,
      organizationId: member.organization.publicId,
      id: member.publicId
    })
  }
}

export class UpdateProfileDto {
  @ApiProperty({ type: () => [AddressDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses: AddressDto[]

  @ApiProperty({ type: () => [ContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[]
}

export class AddressDto {
  @ApiProperty()
  blockchainId: string

  @IsOptional()
  @ApiPropertyOptional()
  tokenId: string

  @IsNotEmpty()
  @ApiProperty({ example: 'USDT' })
  cryptocurrencySymbol: string

  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiProperty()
  address: string

  public static map(address: MemberAddress) {
    const addressDto = new AddressDto()
    addressDto.blockchainId = address.blockchainId?.toString()
    addressDto.tokenId = address.cryptocurrency?.id?.toString()
    addressDto.cryptocurrencySymbol = address.cryptocurrency?.symbol
    addressDto.address = address.address
    return addressDto
  }
}

export class ContactDto {
  @ApiProperty()
  providerId: string

  @ApiProperty()
  content: string

  constructor(params: { providerId: string; content: string }) {
    this.providerId = params.providerId
    this.content = params.content
  }

  public static map(address: MemberContact) {
    return new ContactDto({
      providerId: address.contactProvider?.id?.toString(),
      content: address.content
    })
  }
}

export class OrganizationParam {
  @IsUUID()
  @ApiProperty()
  organizationId: string
}

export class MemberParam extends OrganizationParam {
  @IsUUID()
  @ApiProperty()
  id: string
}
