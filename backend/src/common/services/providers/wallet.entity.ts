import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, Unique } from 'typeorm'
import { Chain } from '../chains/chain.entity'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Account } from '../account/account.entity'

@Entity({ name: 'auth_wallet' })
@Unique(['address'])
export class AuthWallet extends BaseEntity {
  @Column({ unique: true })
  @ApiProperty()
  address: string

  @ManyToOne(() => Account, (account) => account.walletAccounts)
  @JoinColumn({ name: 'account_id' })
  @ApiProperty({ type: () => Account })
  account: Account

  @Column()
  @ApiProperty()
  nonce: string

  @ManyToMany(() => Chain, (chain) => chain.wallets)
  @ApiProperty()
  chains: Chain[]
}
