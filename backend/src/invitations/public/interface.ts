import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { Invitation } from '../../common/services/invitations/invitation.entity'

export class PublicInvitationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  firstName: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  lastName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organizationName: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organizationId: string

  @ApiProperty()
  message: string | null

  constructor(params: {
    firstName: string
    lastName: string
    organizationName: string
    message: string
    organizationId: string
  }) {
    this.firstName = params.firstName
    this.lastName = params.lastName
    this.organizationName = params.organizationName
    this.organizationId = params.organizationId
    this.message = params.message
  }

  static map(params: { invitation: Invitation }) {
    return new this({
      firstName: params.invitation.firstName,
      lastName: params.invitation.lastName,
      organizationName: params.invitation.organization.name,
      organizationId: params.invitation.organization.publicId,
      message: params.invitation.message
    })
  }
}
