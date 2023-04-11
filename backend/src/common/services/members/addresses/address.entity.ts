import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../../core/entities/base.entity'
import { Token } from '../../tokens/token.entity'
import { MemberProfile } from '../member-profile.entity'
import { Cryptocurrency } from '../../cryptocurrencies/cryptocurrency.entity'

@Entity()
export class MemberAddress extends BaseEntity {
  @Column()
  @ApiProperty()
  address: string

  @ManyToOne(() => MemberProfile, (member) => member.addresses)
  @JoinColumn({ name: 'member_profile_id' })
  @ApiProperty()
  profile: MemberProfile

  @Column({ name: 'blockchain_id' })
  @ApiProperty()
  blockchainId: string

  // TODO: Legacy field, remove after migration
  @ManyToOne(() => Token, { nullable: true })
  @JoinColumn()
  token: Token

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency
}
