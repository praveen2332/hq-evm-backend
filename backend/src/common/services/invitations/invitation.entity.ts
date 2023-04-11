import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Organization } from '../organizations/organization.entity'
import { Role } from '../roles/role.entity'
import { InvitationStatus } from '../../../invitations/interface'
import { INVITATION_EXPIRED } from '../../constants'
import { Member } from '../members/member.entity'

@Entity()
export class Invitation extends BaseEntity {
  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  @ApiProperty()
  publicId: string

  @ManyToOne(() => Organization, (organization) => organization.invitations)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization

  @ManyToOne(() => Role, (role) => role.invitations)
  @JoinColumn({ name: 'role_id' })
  role: Role

  @Column({ name: 'first_name' })
  @ApiProperty()
  firstName: string

  @Column({ name: 'last_name' })
  @ApiProperty()
  lastName: string

  @Column({ nullable: true })
  @ApiProperty()
  message: string | null

  @Column({ nullable: true })
  @ApiProperty()
  email: string

  @Column({ nullable: true })
  @ApiProperty()
  address: string

  @ApiProperty()
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'invited_by' })
  invitedBy: Member

  @Column({ name: 'expired_at' })
  @ApiProperty()
  expiredAt: Date

  @Column({ type: 'enum', enum: InvitationStatus })
  @ApiProperty()
  status: InvitationStatus

  static create(params: {
    role: Role
    organization: Organization
    email: string | null
    firstName: string
    lastName: string
    address: string | null
    status: InvitationStatus
    invitedBy: Member
    message: string
  }): Invitation {
    const invitation = new Invitation()
    invitation.role = params.role
    invitation.organization = params.organization
    invitation.email = params.email?.toLowerCase() ?? null
    invitation.firstName = params.firstName
    invitation.lastName = params.lastName
    invitation.address = params.address?.toLowerCase() ?? null
    invitation.status = params.status
    invitation.invitedBy = params.invitedBy
    const now = new Date()
    now.setHours(now.getHours() + INVITATION_EXPIRED)
    invitation.createdAt = new Date()
    invitation.expiredAt = now
    invitation.message = params.message
    return invitation
  }
}
