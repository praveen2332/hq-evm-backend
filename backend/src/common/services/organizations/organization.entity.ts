import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { Column, Entity, Generated, OneToMany, OneToOne } from 'typeorm'
import { Category } from '../../../categories/category.entity'
import { BaseEntity } from '../../../core/entities/base.entity'
import { OrganizationType } from '../../../organizations/interfaces'
import { Recipient } from '../contacts/recipient.entity'
import { SourceOfFund } from '../../../source-of-funds/source-of-fund.entity'
import { Invitation } from '../invitations/invitation.entity'
import { Member } from '../members/member.entity'
import { OrganizationSetting } from '../organization-settings/organization-setting.entity'

@Entity()
export class Organization extends BaseEntity {
  @Column()
  @ApiProperty()
  name: string

  @Column({
    type: 'enum',
    enum: OrganizationType,
    default: OrganizationType.DAO
  })
  @ApiProperty()
  type: OrganizationType

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  @ApiProperty()
  publicId: string

  @OneToMany(() => Member, (member) => member.organization)
  @ApiProperty()
  members: Member[]

  @OneToMany(() => SourceOfFund, (source) => source.organization)
  @ApiProperty()
  sources: SourceOfFund[]

  @OneToMany(() => Recipient, (recipient) => recipient.organization)
  @ApiProperty()
  recipients: Recipient[]

  @OneToMany(() => Invitation, (invitation) => invitation.organization)
  invitations: Invitation[]

  @OneToMany(() => Category, (category) => category.organization)
  categories: Category[]

  @OneToOne(() => OrganizationSetting, (settings) => settings.organization)
  setting: OrganizationSetting
}

export class OrganizationWithRole extends Organization {
  @ApiProperty()
  @IsNotEmpty()
  role: string
}
