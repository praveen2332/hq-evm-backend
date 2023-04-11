import { Column, Entity, Index, OneToMany } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { FinancialTransactionChild } from './financial-transaction-child.entity'
import {
  CreateFinancialTransactionParentDto,
  FinancialTransactionParentActivity,
  FinancialTransactionParentStatus
} from './interfaces'

@Entity()
@Index('UQ_financial_transaction_parent_publicId_organizationId', ['publicId', 'organizationId', 'deletedAt'], {
  unique: true,
  where: `"deleted_at" IS NOT NULL`
})
export class FinancialTransactionParent extends BaseEntity {
  @Column({ name: 'public_id' })
  publicId: string

  @Column()
  hash: string

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column()
  activity: FinancialTransactionParentActivity

  @Column({ name: 'organization_id' })
  organizationId: string

  @Column()
  status: FinancialTransactionParentStatus

  @Column({ name: 'value_timestamp' })
  valueTimestamp: Date

  @OneToMany(
    () => FinancialTransactionChild,
    (financialTransactionChild) => financialTransactionChild.financialTransactionParent
  )
  financialTransactionChild: FinancialTransactionChild[]

  static createFromDto(dto: CreateFinancialTransactionParentDto): FinancialTransactionParent {
    const financialTransactionParent = new FinancialTransactionParent()

    financialTransactionParent.publicId = dto.hash
    financialTransactionParent.hash = dto.hash
    financialTransactionParent.blockchainId = dto.blockchainId
    financialTransactionParent.activity = dto.activity
    financialTransactionParent.organizationId = dto.organizationId
    financialTransactionParent.status = dto.status
    financialTransactionParent.valueTimestamp = dto.valueTimestamp
    return financialTransactionParent
  }
}
