import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../../core/entities/base.entity'
import { Token } from '../../tokens/token.entity'
import { Recipient } from '../recipient.entity'
import { Cryptocurrency } from '../../cryptocurrencies/cryptocurrency.entity'

@Entity()
export class RecipientAddress extends BaseEntity {
  @Column()
  @ApiProperty()
  address: string

  @ManyToOne(() => Recipient, (recipient) => recipient.recipientAddresses)
  @JoinColumn({ name: 'recipient_id' })
  @ApiProperty()
  recipient: Recipient

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  // // TODO: Legacy field, remove after migration
  @ManyToOne(() => Token, (token) => token.recipientAddresses, { nullable: true })
  @JoinColumn()
  token: Token

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency
}
