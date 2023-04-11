import { ApiProperty } from '@nestjs/swagger'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Chain } from '../chains/chain.entity'
import { RecipientAddress } from '../contacts/addresses/address.entity'

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  @ApiProperty()
  name: string

  @ManyToMany(() => Chain, (chain) => chain.tokens)
  @ApiProperty()
  chains: Chain[]

  @OneToMany(() => RecipientAddress, (recipientAddress) => recipientAddress.token)
  recipientAddresses: RecipientAddress[]

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date

  @DeleteDateColumn()
  @ApiProperty()
  deletedAt: Date
}
