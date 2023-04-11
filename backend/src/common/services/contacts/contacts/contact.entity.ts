import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from '../../../../core/entities/base.entity'
import { RecipientContact } from './recipient-contact.entity'
import { MemberContact } from '../../members/contacts/member-contact.entity'

@Entity()
export class ContactProvider extends BaseEntity {
  @Column()
  @ApiProperty()
  name: string

  @OneToMany(() => RecipientContact, (recipientContact) => recipientContact.contactProvider)
  recipientContacts: RecipientContact[]

  @OneToMany(() => MemberContact, (recipientContact) => recipientContact.contactProvider)
  memberContacts: MemberContact[]
}
