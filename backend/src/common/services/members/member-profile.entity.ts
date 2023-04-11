import { Column, Entity, OneToMany, OneToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { MemberAddress } from './addresses/address.entity'
import { Member } from './member.entity'
import { ApiProperty } from '@nestjs/swagger'
import { MemberContact } from './contacts/member-contact.entity'

@Entity()
export class MemberProfile extends BaseEntity {
  @OneToOne(() => Member, (member) => member.profile)
  member: Member

  @OneToMany(() => MemberAddress, (recipientAddress) => recipientAddress.profile)
  addresses: MemberAddress[]

  @OneToMany(() => MemberContact, (contact) => contact.profile)
  @ApiProperty()
  contacts: MemberContact[]
}
