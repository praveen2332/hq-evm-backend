import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'
import { Account } from '../common/services/account/account.entity'
import { Organization } from '../common/services/organizations/organization.entity'
import { PublicEntity } from '../core/entities/base.entity'
import { Transaction } from '../transactions/transaction.entity'
import { CategoryType } from './interfaces'

@Entity()
export class Category extends PublicEntity {
  @ManyToMany(() => Transaction, (transaction) => transaction.categories)
  @JoinTable({ name: 'transaction_category' })
  @ApiProperty()
  transactions: Transaction[]

  @Column()
  @ApiProperty()
  name: string

  @Column()
  @ApiProperty({ nullable: true, type: 'enum' })
  type: CategoryType

  @Column()
  @ApiProperty({ nullable: true })
  code: string

  @Column({ nullable: true })
  @ApiProperty()
  description: string

  @ManyToOne(() => Organization, (organization) => organization.categories)
  @ApiProperty({ type: () => Organization })
  organization: Organization

  @ManyToOne(() => Account, (account) => account.categories)
  @ApiProperty({ type: () => Account })
  createdBy: Account
}
