import Decimal from 'decimal.js'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { CreateTaxLotSaleDto } from './interfaces'
import { TaxLot } from './tax-lot.entity'

@Entity()
export class TaxLotSale extends BaseEntity {
  @Column({ name: 'financial_transaction_child_id' })
  financialTransactionChildId: string

  @ManyToOne(() => TaxLot, (taxLot) => taxLot.taxLotSales)
  @JoinColumn({ name: 'tax_lot_id' })
  taxLot: TaxLot

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency

  @Column({ name: 'sold_amount' })
  soldAmount: string

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({ name: 'cost_basis_amount', nullable: true })
  costBasisAmount: string

  @Column({ name: 'cost_basis_per_unit', nullable: true })
  costBasisPerUnit: string

  @Column({ name: 'cost_basis_fiat_currency' })
  costBasisFiatCurrency: string

  @Column({ name: 'cost_basis_updated_by' })
  costBasisUpdatedBy: string

  @Column({ name: 'sold_at' })
  soldAt: Date

  @Column({ name: 'wallet_id' })
  walletId: string

  @Column({ name: 'organization_id' })
  organizationId: string

  @Column('jsonb', { name: 'audit_metadata_list', nullable: true })
  auditMetadataList: TaxLotSaleAuditMetadata[]

  static createFromDto(dto: CreateTaxLotSaleDto, isInternal: boolean = false): TaxLotSale {
    const taxLotSale = new TaxLotSale()
    taxLotSale.financialTransactionChildId = dto.financialTransactionChildId
    taxLotSale.taxLot = dto.taxLot
    taxLotSale.cryptocurrency = dto.cryptocurrency
    taxLotSale.soldAmount = dto.soldAmount
    taxLotSale.blockchainId = dto.blockchainId
    taxLotSale.costBasisAmount = isInternal ? null : Decimal.mul(dto.taxLot.costBasisPerUnit, dto.soldAmount).toString()
    taxLotSale.costBasisPerUnit = isInternal ? null : dto.taxLot.costBasisPerUnit
    taxLotSale.costBasisFiatCurrency = dto.taxLot.costBasisFiatCurrency
    taxLotSale.costBasisUpdatedBy = dto.updatedBy
    taxLotSale.soldAt = dto.soldAt
    taxLotSale.walletId = dto.walletId
    taxLotSale.organizationId = dto.organizationId
    taxLotSale.auditMetadataList = []

    return taxLotSale
  }
}

export interface TaxLotSaleAuditMetadata {
  updatedAt: Date
  newCostBasisPerUnit: string
  newCostBasisAmount: string
  updatedBy: string
  previousCostBasisPerUnit: string | null
  previousCostBasisAmount: string | null
}
