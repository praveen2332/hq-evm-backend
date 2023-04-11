import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../../core/entities/base.entity'
import { ContactProvider } from '../../contacts/contacts/contact.entity'
import { MemberProfile } from '../member-profile.entity'

@Entity()
export class MemberContact extends BaseEntity {
  @Column()
  @ApiProperty()
  content: string

  @ManyToOne(() => MemberProfile, (profile) => profile.contacts)
  @JoinColumn({ name: 'member_profile_id' })
  @ApiProperty()
  profile: MemberProfile

  @ManyToOne(() => ContactProvider, (contactProvider) => contactProvider.memberContacts)
  @JoinColumn({ name: 'contact_provider_id' })
  @ApiProperty()
  contactProvider: ContactProvider
}
