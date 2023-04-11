import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { CreateTaxLotDto, TaxLotStatus } from './interfaces'
import { TaxLotSale } from './tax-lot-sale.entity'

@Entity()
export class TaxLot extends BaseEntity {
  @Column({ name: 'financial_transaction_child_id' })
  financialTransactionChildId: string

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  publicId: string

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({ name: 'amount_total' })
  amountTotal: string

  @Column({ name: 'amount_available' })
  amountAvailable: string

  @Column({
    type: 'enum',
    enum: TaxLotStatus
  })
  status: TaxLotStatus = TaxLotStatus.AVAILABLE

  @Column({ name: 'status_reason', nullable: true })
  statusReason: string

  @Column({ name: 'purchased_at' })
  purchasedAt: Date

  @Column({ name: 'transferred_at' })
  transferredAt: Date

  @Column({ name: 'cost_basis_amount' })
  costBasisAmount: string

  @Column({ name: 'cost_basis_per_unit' })
  costBasisPerUnit: string

  @Column({ name: 'cost_basis_fiat_currency' })
  costBasisFiatCurrency: string

  @Column({ name: 'wallet_id' })
  walletId: string

  @Column({ name: 'organization_id' })
  organizationId: string

  @Column('jsonb', { name: 'audit_metadata_list', nullable: true })
  auditMetadataList: TaxLotAuditMetadata[]

  @OneToMany(() => TaxLotSale, (TaxLotSale) => TaxLotSale.taxLot)
  taxLotSales: TaxLotSale[]

  // For internal transaction cases
  @Column({ name: 'previous_tax_lot_sale_id', nullable: true })
  previousTaxLotSaleId: string

  static createFromDto(dto: CreateTaxLotDto, auditMetadata: TaxLotAuditMetadata): TaxLot {
    const taxLot = new TaxLot()
    taxLot.financialTransactionChildId = dto.financialTransactionChildId
    taxLot.cryptocurrency = dto.cryptocurrency
    taxLot.blockchainId = dto.blockchainId
    taxLot.amountTotal = dto.amountTotal
    taxLot.amountAvailable = dto.amountAvailable
    taxLot.status = dto.status
    taxLot.statusReason = dto.statusReason
    taxLot.purchasedAt = dto.purchasedAt
    taxLot.transferredAt = dto.transferredAt
    taxLot.costBasisAmount = dto.costBasisAmount
    taxLot.costBasisPerUnit = dto.costBasisPerUnit
    taxLot.costBasisFiatCurrency = dto.costBasisFiatCurrency
    taxLot.walletId = dto.walletId
    taxLot.organizationId = dto.organizationId
    taxLot.previousTaxLotSaleId = dto.previousTaxLotSaleId
    taxLot.auditMetadataList = [auditMetadata]

    return taxLot
  }
}

export interface TaxLotAuditMetadata {
  amountAvailable: string
  updatedAt: Date
  newCostBasisPerUnit: string
  updatedBy: string
  previousCostBasisPerUnit: string | null
  status: string
  statusReason: string
}
