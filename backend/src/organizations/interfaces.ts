import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEthereumAddress, IsNotEmpty } from 'class-validator'
import { Member } from '../common/services/members/member.entity'
import { Organization } from '../common/services/organizations/organization.entity'

export class CreateOrganizationDto {
  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  type: OrganizationType

  members?: Member[]
}

export class ValidateAddressDto {
  @IsNotEmpty()
  @IsEthereumAddress()
  @ApiPropertyOptional({ example: '0x0000000000000000000000000000000000000000' })
  address: string
}

export class UpdateOrganizationDto {
  @IsNotEmpty()
  @ApiProperty()
  id: string

  @IsNotEmpty()
  @ApiProperty()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  type: OrganizationType
}

export class PublicOrganizationDto {
  @ApiProperty()
  name: string

  @ApiProperty()
  publicId: string

  constructor(param: { name: string; publicId: string }) {
    this.name = param.name
    this.publicId = param.publicId
  }

  static map(param: { organization: Organization }) {
    return new PublicOrganizationDto({
      name: param.organization.name,
      publicId: param.organization.publicId
    })
  }
}

export enum OrganizationType {
  DAO = 'DAO',
  COMPANY = 'COMPANY'
}
