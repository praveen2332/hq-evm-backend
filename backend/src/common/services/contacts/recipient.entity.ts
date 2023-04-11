import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Organization } from '../organizations/organization.entity'
import { RecipientAddress } from './addresses/address.entity'
import { RecipientContact } from './contacts/recipient-contact.entity'
import { ERecipientType } from '../../../recipients/interface'

@Entity()
export class Recipient extends BaseEntity {
  @Column({ name: 'organization_name', nullable: true })
  @ApiProperty()
  organizationName: string

  @Column({ name: 'organization_address', nullable: true })
  @ApiProperty()
  organizationAddress: string

  @Column({ name: 'contact_name', nullable: true })
  @ApiProperty()
  contactName: string

  @Column({ type: 'enum', enum: ERecipientType })
  @ApiProperty()
  type: ERecipientType

  @ManyToOne(() => Organization, (organization) => organization.recipients)
  @JoinColumn({ name: 'organization_id' })
  @ApiProperty({ type: () => Organization })
  organization: Organization

  @OneToMany(() => RecipientContact, (contact) => contact.recipient)
  @ApiProperty()
  recipientContacts: RecipientContact[]

  @OneToMany(() => RecipientAddress, (address) => address.recipient)
  recipientAddresses: RecipientAddress[]
}
