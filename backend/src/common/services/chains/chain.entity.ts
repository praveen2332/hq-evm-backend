import { ApiProperty } from '@nestjs/swagger'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import { AuthWallet } from '../providers/wallet.entity'
import { Token } from '../tokens/token.entity'

@Entity()
export class Chain {
  @PrimaryColumn()
  id: number

  @Column()
  @ApiProperty()
  name: string

  @Column()
  @ApiProperty()
  isTestnet: boolean

  @ManyToMany(() => AuthWallet, (wallet) => wallet.chains)
  @JoinTable({ name: 'wallet_chain' })
  @ApiProperty()
  wallets: AuthWallet[]

  @ManyToMany(() => Token, (token) => token.chains)
  @JoinTable({ name: 'supported_tokens' })
  @ApiProperty()
  tokens: Token[]

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
