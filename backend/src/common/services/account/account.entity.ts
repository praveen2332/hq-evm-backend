import {ApiProperty} from '@nestjs/swagger'
import {Column, Entity, OneToMany} from 'typeorm'
import {Category} from '../../../categories/category.entity'
import {BaseEntity} from '../../../core/entities/base.entity'
import {Transaction} from '../../../transactions/transaction.entity'
import {Member} from '../members/member.entity'
import {AuthEmail} from '../providers/email.entity'
import {AuthTwitter} from '../providers/twitter.entity'
import {AuthWallet} from '../providers/wallet.entity'

@Entity()
export class Account extends BaseEntity {
  //TODO: later we can remove this field
  @Column()
  name: string

  @Column({name: 'first_name', nullable: true})
  @ApiProperty()
  firstName: string

  @Column({name: 'last_name', nullable: true})
  @ApiProperty()
  lastName: string

  @OneToMany(() => AuthWallet, (walletAccount) => walletAccount.account)
  @ApiProperty()
  walletAccounts: AuthWallet[]

  @OneToMany(() => AuthEmail, (emailAccount) => emailAccount.account)
  @ApiProperty()
  emailAccounts: AuthEmail[]

  @OneToMany(() => AuthTwitter, (twitterAccount) => twitterAccount.account)
  @ApiProperty()
  twitterAccounts: AuthTwitter[]

  @OneToMany(() => Transaction, (transaction) => transaction.txCreator)
  transactions: Transaction[]

  @OneToMany(() => Category, (category) => category.createdBy)
  @ApiProperty()
  categories: Category[]

  @Column({nullable: true})
  image: string

  @Column({nullable: true, name: 'active_organization_id'})
  activeOrganizationId: string

  @OneToMany(() => Member, (member) => member.account)
  members: Member[]
}
