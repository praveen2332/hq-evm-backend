import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Account } from '../account/account.entity'
import { Organization } from '../organizations/organization.entity'
import { Role } from '../roles/role.entity'
import { MemberProfile } from './member-profile.entity'

@Entity()
export class Member extends BaseEntity {
  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  @ApiProperty()
  publicId: string

  @ManyToOne(() => Role, (role) => role.members)
  @JoinColumn({ name: 'role_id' })
  @ApiProperty({ type: () => Role })
  role: Role

  @ManyToOne(() => Organization, (organization) => organization.members)
  @JoinColumn({ name: 'organization_id' })
  @ApiProperty({ type: () => Organization })
  organization: Organization

  @ManyToOne(() => Account, (account) => account.members)
  @JoinColumn({ name: 'account_id' })
  @ApiProperty({ type: () => Account })
  account: Account

  @OneToOne(() => MemberProfile)
  @JoinColumn({ name: 'member_profile_id' })
  @ApiProperty({ type: () => MemberProfile })
  profile: MemberProfile

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'deleted_by' })
  @ApiProperty()
  deletedBy: Member
}
