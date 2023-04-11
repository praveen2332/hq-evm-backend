import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { FinancialTransactionChildMetadata } from './financial-transaction-child-metadata.entity'
import { FinancialTransactionParent } from './financial-transaction-parent.entity'
import { CreateFinancialTransactionChildDto } from './interfaces'

@Entity()
@Index('UQ_financial_transaction_child_publicId_organizationId', ['publicId', 'organizationId', 'deletedAt'], {
  unique: true,
  where: `"deleted_at" IS NOT NULL`
})
export class FinancialTransactionChild extends BaseEntity {
  @Column({ name: 'public_id' })
  publicId: string

  @Column()
  hash: string

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({ name: 'from_address' })
  fromAddress: string

  @Column({ name: 'to_address', nullable: true }) // Will be nullable for fee
  toAddress: string

  @Column({ name: 'proxy_address', nullable: true })
  proxyAddress: string

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency

  @Column({ name: 'cryptocurrency_amount' })
  cryptocurrencyAmount: string

  @Column({ name: 'value_timestamp' })
  valueTimestamp: Date

  @Column({ name: 'organization_id' })
  organizationId: string

  @ManyToOne(
    () => FinancialTransactionParent,
    (financialTransactionParent) => financialTransactionParent.financialTransactionChild
  )
  @JoinColumn({ name: 'financial_transaction_parent_id' })
  financialTransactionParent: FinancialTransactionParent

  @OneToOne(
    () => FinancialTransactionChildMetadata,
    (financialTransactionChildMetadata) => financialTransactionChildMetadata.financialTransactionChild
  )
  financialTransactionChildMetadata: FinancialTransactionChildMetadata

  static createFromDto(dto: CreateFinancialTransactionChildDto): FinancialTransactionChild {
    const financialTransactionChild = new FinancialTransactionChild()
    financialTransactionChild.publicId = dto.publicId
    financialTransactionChild.hash = dto.hash
    financialTransactionChild.blockchainId = dto.blockchainId
    financialTransactionChild.fromAddress = dto.fromAddress
    financialTransactionChild.toAddress = dto.toAddress
    financialTransactionChild.proxyAddress = dto.proxyAddress ?? null
    financialTransactionChild.cryptocurrency = dto.cryptocurrency
    financialTransactionChild.cryptocurrencyAmount = dto.cryptocurrencyAmount
    financialTransactionChild.valueTimestamp = dto.valueTimestamp
    financialTransactionChild.organizationId = dto.organizationId
    financialTransactionChild.financialTransactionParent = dto.financialTransactionParent

    return financialTransactionChild
  }
}
