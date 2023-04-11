import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Account } from '../account/account.entity'

@Entity({ name: 'auth_email' })
export class AuthEmail extends BaseEntity {
  @Column({ unique: true, nullable: true })
  @ApiProperty()
  email: string

  @Index()
  @Column({ unique: true })
  @ApiProperty()
  verifierId: string

  @ManyToOne(() => Account, (account) => account.emailAccounts)
  @JoinColumn({ name: 'account_id' })
  @ApiProperty({ type: () => Account })
  account: Account
}
