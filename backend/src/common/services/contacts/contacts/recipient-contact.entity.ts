import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '../../../../core/entities/base.entity'
import { Recipient } from '../recipient.entity'
import { ContactProvider } from './contact.entity'

@Entity()
export class RecipientContact extends BaseEntity {
  @Column()
  @ApiProperty()
  content: string

  @ManyToOne(() => Recipient, (recipient) => recipient.recipientContacts)
  @JoinColumn({ name: 'recipient_id' })
  @ApiProperty()
  recipient: Recipient

  @ManyToOne(() => ContactProvider, (contactProvider) => contactProvider.recipientContacts)
  @JoinColumn({ name: 'contact_provider_id' })
  @ApiProperty()
  contactProvider: ContactProvider
}
