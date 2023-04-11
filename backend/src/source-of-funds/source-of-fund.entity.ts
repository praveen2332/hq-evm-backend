import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { Organization } from '../common/services/organizations/organization.entity'
import { BaseEntity } from '../core/entities/base.entity'
import { Transaction } from '../transactions/transaction.entity'
import { SafeOwner, SourceBalance, SourceType } from './interfaces'

@Entity()
export class SourceOfFund extends BaseEntity {
  @ManyToOne(() => Organization, (organization) => organization.sources)
  @JoinColumn({ name: 'organization_id' })
  @ApiProperty()
  organization: Organization

  @Column()
  @ApiProperty()
  name: string

  @Column({ name: 'source_id' })
  @ApiProperty()
  sourceId: string

  @Column({ name: 'source_type', type: 'enum', enum: SourceType, default: SourceType.FTX })
  @ApiProperty()
  sourceType: SourceType

  @OneToMany(() => Transaction, (transaction) => transaction.source)
  transactions: Transaction[]

  @Column({ type: 'json', nullable: true })
  @ApiProperty()
  balance: SourceBalance

  @Column({ type: 'boolean', nullable: true, default: false })
  @ApiProperty()
  disabled: boolean
}

export class SourceOfFundGnosis extends SourceOfFund {
  @ApiProperty()
  address?: string

  @ApiProperty()
  blockchainId?: string

  @ApiProperty()
  threshold?: number

  @ApiProperty()
  ownerAddresses?: SafeOwner[]
}
